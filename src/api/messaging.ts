import { ApiError, MESSAGING_BASE, post } from './client'

const p = <T>(path: string, body: Record<string, unknown>) =>
  post<T>(MESSAGING_BASE, path, body)

// — Workspaces —
export const listWorkspaces = (cookie: string) =>
  p('/workspaces/list', { cookie })

export const createWorkspace = (cookie: string, name: string, icon?: string) =>
  p('/workspaces/create', { cookie, name, ...(icon ? { icon } : {}) })

export async function uploadWorkspaceIcon(cookie: string, workspaceId: number, file: File): Promise<void> {
  const form = new FormData()
  form.append('cookie', cookie)
  form.append('workspaceId', String(workspaceId))
  form.append('file', file)

  const res = await fetch(`${MESSAGING_BASE}/workspaces/icon/upload`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(res.status, data?.message ?? data?.detail ?? `Erreur HTTP ${res.status}`)
  }
}

// — Members —
export const listMembers = (cookie: string, workspaceId: number) =>
  p('/workspaces/members/list', { cookie, workspaceId })

export const addMember = (cookie: string, workspaceId: number, userId: number) =>
  p('/workspaces/members/add', { cookie, workspaceId, userId })

// — Channels —
export const listChannels = (cookie: string, workspaceId: number) =>
  p('/channels/list', { cookie, workspaceId })

export const createChannel = (cookie: string, workspaceId: number, name: string) =>
  p('/channels/create', { cookie, workspaceId, name, isPrivate: false })

export const addChannelMember = (cookie: string, channelId: number, userId: number) =>
  p('/channels/members/add', { cookie, channelId, userId })

// — DMs —
export const listDms = (cookie: string, workspaceId: number) =>
  p('/dms/list', { cookie, workspaceId })

export const openDm = (cookie: string, workspaceId: number, targetUserId: number) =>
  p('/dms/open', { cookie, workspaceId, targetUserId })

// — Messages —
export const listMessages = (cookie: string, channelId?: number, dmId?: number) =>
  p('/messages/list', { cookie, limit: 80, ...(channelId ? { channelId } : { dmId }) })

export const sendMessage = (cookie: string, content: string, channelId?: number, dmId?: number) =>
  p('/messages/send', { cookie, content, ...(channelId ? { channelId } : { dmId }) })
