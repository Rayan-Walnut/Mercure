import { useCallback } from 'react'
import { useSessionStore } from '../store/useSessionStore'
import { useAppStore } from '../store/useAppStore'
import * as api from '../api/messaging'
import * as authApi from '../api/auth'
import { resolveAvatarUrl } from '../utils/avatar'

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value !== 'string') continue
    const next = value.trim()
    if (next) return next
  }
  return undefined
}

function isEmail(value?: string): value is string {
  if (!value) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function pickNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const n = Number(value)
    if (Number.isFinite(n) && n > 0) return n
  }
  return null
}

function normalizeMembers(data: any, userEmail?: string, userId?: number) {
  const raw: any[] = data?.members ?? data?.items ?? data?.data ?? []
  const members = raw.map((m: any) => {
    const user = m.user ?? m
    const emailRaw = pickString(m.email, user.email)
    const avatarRaw = pickString(m.avatar, m.avatar_url, user.avatar, user.avatar_url)
    const id = pickNumber(m.userId, m.id, user.id)
    return {
      id,
      username: m.username ?? user.username ?? (isEmail(emailRaw) ? emailRaw : undefined) ?? `User ${id ?? 'inconnu'}`,
      email: isEmail(emailRaw) ? emailRaw : undefined,
      avatar: resolveAvatarUrl(avatarRaw),
      role: m.role,
    }
  }).filter((m: any) => typeof m.id === 'number')

  const byId = userId
    ? members.find((m: any) => Number(m.id) === Number(userId))?.id
    : null
  const byEmail = members.find((m: any) =>
    userEmail && m.email?.toLowerCase() === userEmail.toLowerCase()
  )?.id
  const currentUserId = byId ?? byEmail ?? null

  return { members, currentUserId }
}

function normalizeArray(data: any, keys: string[]): any[] {
  if (Array.isArray(data)) return data
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
    if (Array.isArray(data?.data?.[key])) return data.data[key]
  }
  return []
}

export function useWorkspace() {
  const cookie = useSessionStore(s => s.cookie)
  const user = useSessionStore(s => s.user)
  const store = useAppStore()

  const loadWorkspaces = useCallback(async () => {
    const data = await api.listWorkspaces(cookie) as any
    const raw = data?.items ?? data?.workspaces ?? []
    const workspaces = raw.map((entry: any) => {
      const w = entry.workspace ?? entry
      return {
        id: w.id,
        name: w.name ?? `Workspace ${w.id}`,
        icon: w.icon ?? null,
        ownerId: w.ownerId,
        createdAt: w.createdAt,
      }
    })
    store.setWorkspaces(workspaces)
    return workspaces
  }, [cookie])

  const loadWorkspaceScope = useCallback(async (workspaceId: number) => {
    store.setScopeLoading(true)
    try {
      const [membersData, channelsData, dmsData] = await Promise.all([
        api.listMembers(cookie, workspaceId),
        api.listChannels(cookie, workspaceId),
        api.listDms(cookie, workspaceId),
      ])

      const { members, currentUserId } = normalizeMembers(membersData, user?.email, user?.id)

      // Une seule requête batch pour tous les avatars manquants
      const emailsWithoutAvatar = members
        .filter(m => !m.avatar && m.email)
        .map(m => m.email as string)

      let avatarMap: Record<string, string | null> = {}
      if (emailsWithoutAvatar.length > 0) {
        try {
          const usersInfo = await authApi.usersInfo(cookie, emailsWithoutAvatar) as any[]
          for (const u of usersInfo) {
            if (u.email) avatarMap[u.email.toLowerCase()] = resolveAvatarUrl(u.avatar) ?? null
          }
        } catch {
          // ignore
        }
      }

      const enrichedMembers = members.map(m => {
        if (m.avatar) return m
        if (m.id === currentUserId && user?.avatar) return { ...m, avatar: resolveAvatarUrl(user.avatar) }
        const mapped = m.email ? avatarMap[m.email.toLowerCase()] : null
        return { ...m, avatar: mapped ?? null }
      })

      store.setMembers(enrichedMembers, currentUserId)

      const mapChannels = (data: any) => normalizeArray(data, ['channels', 'items']).map((c: any) => ({
        id: c.id,
        workspaceId: c.workspaceId,
        name: c.name ?? `canal-${c.id}`,
        isPrivate: c.isPrivate ?? false,
        category: pickString(c.category) ?? null,
      }))
      const channels = mapChannels(channelsData)

      const dms = normalizeArray(dmsData, ['dms', 'items']).map((d: any) => ({
        id: d.id,
        workspaceId: d.workspaceId,
        participants: Array.isArray(d.participants) ? d.participants.map(Number) : [],
      }))
      store.setDms(dms)

      if (channels.length === 0) {
        try {
          await api.createChannel(cookie, workspaceId, 'general')
        } catch { /* ignore */ }
        const channelsData2 = await api.listChannels(cookie, workspaceId) as any
        const refreshedChannels = mapChannels(channelsData2)
        store.setChannels(refreshedChannels)
        return { channels: refreshedChannels, dms }
      }

      store.setChannels(channels)
      return { channels, dms }
    } finally {
      store.setScopeLoading(false)
    }
  }, [cookie, user])

  const loadMessages = useCallback(async () => {
    const thread = useAppStore.getState().activeThread
    if (!thread) return
    const data = await api.listMessages(
      cookie,
      thread.type === 'channel' ? thread.id : undefined,
      thread.type === 'dm' ? thread.id : undefined,
    )
    const messages = normalizeArray(data, ['messages', 'items']).map((m: any) => {
      const senderId = pickNumber(m.senderId, m.sender?.id)
      const member = senderId ? useAppStore.getState().membersById.get(senderId) : undefined
      const id = pickNumber(m.id)
      return {
        id: id ?? 0,
        channelId: pickNumber(m.channelId) ?? null,
        dmId: pickNumber(m.dmId) ?? null,
        senderId: senderId ?? null,
        senderAvatar: member?.avatar ?? resolveAvatarUrl(m.sender?.avatar),
        senderUsername: member?.username ?? m.sender?.username ?? null,
        content: String(m.content ?? ''),
        createdAt: typeof m.createdAt === 'string' ? m.createdAt : undefined,
      }
    }).filter(m => m.id > 0)
    store.setMessages(messages)
  }, [cookie])

  return { loadWorkspaces, loadWorkspaceScope, loadMessages }
}
