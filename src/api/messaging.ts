import { ApiError, MESSAGING_BASE, PROFILE_BASE, fetchWithAuth, postAuth } from './client'

const p = <T>(path: string, body: Record<string, unknown>) =>
  postAuth<T>(MESSAGING_BASE, path, body)

const pProfile = <T>(path: string, body: Record<string, unknown>) =>
  postAuth<T>(PROFILE_BASE, path, body)

// - Workspaces -
export const listWorkspaces = () =>
  p('/workspaces/list', {})

export const createWorkspace = (name: string, icon?: string) =>
  p('/workspaces/create', { name, ...(icon ? { icon } : {}) })

export async function uploadWorkspaceIcon(workspaceId: number, file: File): Promise<void> {
  const form = new FormData()
  form.append('workspaceId', String(workspaceId))
  form.append('file', file)

  const res = await fetchWithAuth(MESSAGING_BASE, '/workspaces/icon/upload', {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(res.status, data?.message ?? data?.detail ?? `Erreur HTTP ${res.status}`)
  }
}

// - Members -
export const listMembers = (workspaceId: number) =>
  p('/workspaces/members/list', { workspaceId })

export const addMember = (workspaceId: number, userId: number) =>
  p('/workspaces/members/add', { workspaceId, userId })

export const updateChannel = (channelId: number, category?: string | null, position?: number) =>
  p('/channels/update', {
    channelId,
    ...(category !== undefined ? { category } : {}),
    ...(position !== undefined ? { position } : {}),
  })

export const renameChannel = (channelId: number, name: string) =>
  p('/channels/rename', { channelId, name })

export const deleteChannel = (channelId: number) =>
  p('/channels/delete', { channelId })

export const addMemberByEmail = (
  workspaceId: number,
  email: string,
  role: 'member' | 'admin' = 'member',
) => p('/workspaces/members/add-by-email', { workspaceId, email, role })

// - Channels -
export const listChannels = (workspaceId: number) =>
  p('/channels/list', { workspaceId })

export const createChannel = (
  workspaceId: number,
  name: string,
  isPrivate = false,
  category?: string,
) => p('/channels/create', { workspaceId, name, isPrivate, ...(category ? { category } : {}) })

export const addChannelMember = (channelId: number, userId: number) =>
  p('/channels/members/add', { channelId, userId })

// - DMs -
export const listDms = (workspaceId: number) =>
  p('/dms/list', { workspaceId })

export const openDm = (workspaceId: number, userId: number) =>
  p('/dms/open', { workspaceId, participantUserId: userId })

export const getProfileAvatar = (email?: string) =>
  pProfile<{
    email?: string
    avatar_url?: string
    avatarUrl?: string
    avatar?: string
  }>('/profile/avatar', { ...(email ? { email } : {}) })

// - Friends -
export const listFriends = (workspaceId: number) =>
  p('/friends/list', { workspaceId })

export const listFriendRequests = (
  workspaceId: number,
  direction: 'incoming' | 'outgoing',
  status = 'pending',
) => p('/friends/requests/list', { workspaceId, direction, status })

export const sendFriendRequest = (workspaceId: number, userId: number) =>
  p('/friends/request', { workspaceId, userId })

export const sendFriendRequestByEmail = (workspaceId: number, email: string) =>
  p('/friends/request-by-email', { workspaceId, email })

export const respondFriendRequest = (
  workspaceId: number,
  requestId: number,
  action: 'accept' | 'decline',
) => p('/friends/respond', { workspaceId, requestId, action })

export const removeFriend = (workspaceId: number, userId: number) =>
  p('/friends/remove', { workspaceId, userId })

export const searchDmUsers = (workspaceId: number, query: string, onlyFriends = false) =>
  p('/dms/users/list', { workspaceId, query, onlyFriends, limit: 20 })

export const listDmUsers = (workspaceId: number, query?: string, onlyFriends = false) =>
  p('/dms/users/list', {
    workspaceId,
    ...(query?.trim() ? { query: query.trim() } : {}),
    onlyFriends,
    limit: 20,
  })

// - Messages -
export const listMessages = (channelId?: number, dmId?: number) =>
  p('/messages/list', { limit: 80, ...(channelId ? { channelId } : { dmId }) })

export const sendMessage = (content: string, channelId?: number, dmId?: number) =>
  p('/messages/send', { content, ...(channelId ? { channelId } : { dmId }) })

/**
 * Liste les membres d'un workspace avec leur profil
 */
export const listWorkspaceMembers = (workspaceId: number) =>
  p('/workspaces/members/list', { workspaceId })

/**
 * Retourne les IDs des membres actuellement connectes via WebSocket
 */
export const onlineMembers = (workspaceId: number) =>
  p('/workspaces/members/online', { workspaceId })
