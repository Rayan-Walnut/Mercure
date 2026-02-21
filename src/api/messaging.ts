import { ApiError, MESSAGING_BASE, PROFILE_BASE, post } from './client'

const p = <T>(path: string, body: Record<string, unknown>) =>
  post<T>(MESSAGING_BASE, path, body)

const pProfile = <T>(path: string, body: Record<string, unknown>) =>
  post<T>(PROFILE_BASE, path, body)

// - Workspaces -
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

// - Members -
export const listMembers = (cookie: string, workspaceId: number) =>
  p('/workspaces/members/list', { cookie, workspaceId })

export const addMember = (cookie: string, workspaceId: number, userId: number) =>
  p('/workspaces/members/add', { cookie, workspaceId, userId })

export const updateChannel = (cookie: string, channelId: number, category?: string | null, position?: number) =>
  p('/channels/update', { cookie, channelId, ...(category !== undefined ? { category } : {}), ...(position !== undefined ? { position } : {}) })

export const renameChannel = (cookie: string, channelId: number, name: string) =>
  p('/channels/rename', { cookie, channelId, name })

export const deleteChannel = (cookie: string, channelId: number) =>
  p('/channels/delete', { cookie, channelId })

export const addMemberByEmail = (
  cookie: string,
  workspaceId: number,
  email: string,
  role: 'member' | 'admin' = 'member',
) => p('/workspaces/members/add-by-email', { cookie, workspaceId, email, role })

// - Channels -
export const listChannels = (cookie: string, workspaceId: number) =>
  p('/channels/list', { cookie, workspaceId })

export const createChannel = (
  cookie: string,
  workspaceId: number,
  name: string,
  isPrivate = false,
  category?: string,
) => p('/channels/create', { cookie, workspaceId, name, isPrivate, ...(category ? { category } : {}) })

export const addChannelMember = (cookie: string, channelId: number, userId: number) =>
  p('/channels/members/add', { cookie, channelId, userId })

// - DMs -
export const listDms = (cookie: string, workspaceId: number) =>
  p('/dms/list', { cookie, workspaceId })

export const openDm = (cookie: string, workspaceId: number, userId: number) =>
  p('/dms/open', { cookie, workspaceId, participantUserId: userId })

export const getProfileAvatar = (cookie: string, email?: string) =>
  pProfile<{
    email?: string
    avatar_url?: string
    avatarUrl?: string
    avatar?: string
  }>('/profile/avatar', { cookie, ...(email ? { email } : {}) })

// - Friends -
export const listFriends = (cookie: string, workspaceId: number) =>
  p('/friends/list', { cookie, workspaceId })

export const listFriendRequests = (
  cookie: string,
  workspaceId: number,
  direction: 'incoming' | 'outgoing',
  status = 'pending',
) => p('/friends/requests/list', { cookie, workspaceId, direction, status })

export const sendFriendRequest = (cookie: string, workspaceId: number, userId: number) =>
  p('/friends/request', { cookie, workspaceId, userId })

export const sendFriendRequestByEmail = (cookie: string, workspaceId: number, email: string) =>
  p('/friends/request-by-email', { cookie, workspaceId, email })

export const respondFriendRequest = (
  cookie: string,
  workspaceId: number,
  requestId: number,
  action: 'accept' | 'decline',
) => p('/friends/respond', { cookie, workspaceId, requestId, action })

export const removeFriend = (cookie: string, workspaceId: number, userId: number) =>
  p('/friends/remove', { cookie, workspaceId, userId })

export const searchDmUsers = (cookie: string, workspaceId: number, query: string, onlyFriends = false) =>
  p('/dms/users/list', { cookie, workspaceId, query, onlyFriends, limit: 20 })

export const listDmUsers = (cookie: string, workspaceId: number, query?: string, onlyFriends = false) =>
  p('/dms/users/list', {
    cookie,
    workspaceId,
    ...(query?.trim() ? { query: query.trim() } : {}),
    onlyFriends,
    limit: 20,
  })

// - Messages -
export const listMessages = (cookie: string, channelId?: number, dmId?: number) =>
  p('/messages/list', { cookie, limit: 80, ...(channelId ? { channelId } : { dmId }) })

export const sendMessage = (cookie: string, content: string, channelId?: number, dmId?: number) =>
  p('/messages/send', { cookie, content, ...(channelId ? { channelId } : { dmId }) })

/**
 * Liste les membres d'un workspace avec leur profil
 */
export const listWorkspaceMembers = (cookie: string, workspaceId: number) =>
  p('/workspaces/members/list', { cookie, workspaceId })

/**
 * Retourne les IDs des membres actuellement connectés via WebSocket
 */
export const onlineMembers = (cookie: string, workspaceId: number) =>
  p('/workspaces/members/online', { cookie, workspaceId })