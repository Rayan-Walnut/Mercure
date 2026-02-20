import { useCallback } from 'react'
import { useSessionStore } from '../store/useSessionStore'
import { useAppStore } from '../store/useAppStore'
import * as api from '../api/messaging'

function normalizeMembers(data: any, userEmail?: string, userId?: number) {
  const raw: any[] = data?.members ?? data?.items ?? data?.data ?? []
  const members = raw.map((m: any) => {
    const user = m.user ?? m
    return {
      id: m.userId ?? m.id ?? user.id,
      username: m.username ?? user.username ?? user.email ?? `User ${m.id}`,
      email: m.email ?? user.email,
      avatar: m.avatar ?? user.avatar ?? null,
      role: m.role,
    }
  }).filter((m: any) => m.id)

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
    if (!store.activeWorkspaceId && workspaces.length > 0) {
      store.setActiveWorkspace(workspaces[0].id)
    }
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
      store.setMembers(members, currentUserId)

      const mapChannels = (data: any) => normalizeArray(data, ['channels', 'items']).map((c: any) => ({
        id: c.id,
        workspaceId: c.workspaceId,
        name: c.name ?? `canal-${c.id}`,
        isPrivate: c.isPrivate ?? false,
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
    const messages = normalizeArray(data, ['messages', 'items']).map((m: any) => ({
      id: m.id,
      channelId: m.channelId ?? null,
      dmId: m.dmId ?? null,
      senderId: m.senderId ?? null,
      content: String(m.content ?? ''),
      createdAt: m.createdAt,
    }))
    store.setMessages(messages)
  }, [cookie])

  return { loadWorkspaces, loadWorkspaceScope, loadMessages }
}
