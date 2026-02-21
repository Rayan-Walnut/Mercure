import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import * as api from '../api/messaging'
import { resolveAvatarImageUrl, resolveAvatarUrl } from '../utils/avatar'

type Friend = {
  id: number
  username: string
  avatar?: string | null
  dmId?: number | null
}

type FriendRequest = {
  id: number
  fromUserId: number
  toUserId: number
  username: string
  avatar?: string | null
}

type FriendStatus =
  | 'none'
  | 'friend'
  | 'pending_sent'
  | 'pending_received'
  | 'outgoing_pending'
  | 'incoming_pending'
  | 'accepted'

type SearchUser = {
  id: number
  username: string
  email?: string
  avatar?: string | null
  friendStatus: FriendStatus
  friendRequestId?: number | null
  dmId?: number | null
}

type Tab = 'friends' | 'requests' | 'search'

function asArray(data: any, keys: string[]): any[] {
  if (Array.isArray(data)) return data
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
    if (Array.isArray(data?.data?.[key])) return data.data[key]
  }
  return []
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const n = Number(value)
    if (Number.isFinite(n) && n > 0) return n
  }
  return null
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value !== 'string') continue
    const s = value.trim()
    if (s) return s
  }
  return null
}

function normalizeStatus(value: unknown): FriendStatus {
  const allowed: FriendStatus[] = [
    'none',
    'friend',
    'pending_sent',
    'pending_received',
    'outgoing_pending',
    'incoming_pending',
    'accepted',
  ]
  return allowed.includes(value as FriendStatus) ? (value as FriendStatus) : 'none'
}

export default function FriendsPanel() {
  const activeWorkspaceId = useAppStore(s => s.activeWorkspaceId)
  const setActiveThread = useAppStore(s => s.setActiveThread)

  const [tab, setTab] = useState<Tab>('friends')
  const [friends, setFriends] = useState<Friend[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [requestEmail, setRequestEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submittingInvite, setSubmittingInvite] = useState(false)
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionInfo, setActionInfo] = useState('')

  useEffect(() => {
    if (activeWorkspaceId == null) return
    loadFriends()
    loadRequests()
    loadUsers('')
  }, [activeWorkspaceId])

  async function loadFriends() {
    if (activeWorkspaceId == null) return
    try {
      const data = await api.listFriends(activeWorkspaceId) as any
      const raw = asArray(data, ['items', 'friends'])
      setFriends(raw.map((f: any) => ({
        id: firstNumber(f.userId, f.user?.id, f.id) ?? 0,
        username:
          firstString(f.username, f.user?.username, f.user?.email, f.email) ??
          `User ${firstNumber(f.userId, f.user?.id, f.id) ?? 'inconnu'}`,
        avatar: resolveAvatarUrl(firstString(f.avatar, f.avatar_url, f.user?.avatar, f.user?.avatar_url)),
        dmId: f.dmId ?? null,
      })).filter((f: Friend) => Number.isFinite(f.id) && f.id > 0))
    } catch {
      setFriends([])
    }
  }

  async function loadRequests() {
    if (activeWorkspaceId == null) return
    try {
      const data = await api.listFriendRequests(activeWorkspaceId, 'incoming') as any
      const raw = asArray(data, ['items', 'requests'])
      setRequests(raw.map((r: any) => ({
        id: firstNumber(r.id, r.requestId, r.friendRequestId, r.request?.id) ?? 0,
        fromUserId:
          firstNumber(
            r.fromUserId,
            r.from?.id,
            r.senderId,
            r.sender?.id,
            r.requesterId,
            r.requester?.id,
            r.userId,
            r.user?.id,
          ) ?? 0,
        toUserId:
          firstNumber(
            r.toUserId,
            r.to?.id,
            r.receiverId,
            r.receiver?.id,
            r.targetUserId,
            r.target?.id,
          ) ?? 0,
        username:
          firstString(
            r.from?.username,
            r.sender?.username,
            r.requester?.username,
            r.user?.username,
            r.username,
            r.fromUsername,
            r.senderUsername,
            r.requesterUsername,
            r.from?.email,
            r.sender?.email,
            r.requester?.email,
            r.user?.email,
            r.email,
          ) ?? `User ${firstNumber(r.fromUserId, r.from?.id, r.senderId, r.requesterId, r.userId) ?? 'inconnu'}`,
        avatar:
          resolveAvatarUrl(
            firstString(
              r.from?.avatar,
              r.from?.avatar_url,
              r.sender?.avatar,
              r.sender?.avatar_url,
              r.requester?.avatar,
              r.requester?.avatar_url,
              r.user?.avatar,
              r.user?.avatar_url,
              r.avatar,
              r.avatar_url,
            ),
          ),
      })).filter((r: FriendRequest) => Number.isFinite(r.id) && r.id > 0))
    } catch {
      setRequests([])
    }
  }

  async function loadUsers(query: string) {
    if (activeWorkspaceId == null) return
    const data = await api.listDmUsers(activeWorkspaceId, query) as any
    const raw = asArray(data, ['items', 'users'])
    setSearchResults(raw.map((u: any) => ({
      id: firstNumber(u.user?.id, u.id, u.userId) ?? 0,
      username:
        firstString(u.user?.username, u.username, u.user?.email, u.email) ??
        `User ${firstNumber(u.user?.id, u.id, u.userId) ?? 'inconnu'}`,
      email: firstString(u.user?.email, u.email) ?? undefined,
      avatar: resolveAvatarUrl(firstString(u.user?.avatar, u.user?.avatar_url, u.avatar, u.avatar_url)),
      friendStatus: normalizeStatus(u.friendStatus),
      friendRequestId: u.friendRequestId ?? u.requestId ?? null,
      dmId: u.dmId ?? null,
    })).filter((u: SearchUser) => Number.isFinite(u.id) && u.id > 0))
  }

  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (activeWorkspaceId == null) return
    setLoading(true)
    try {
      await loadUsers(query)
    } catch {
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  async function handleInviteMemberByEmail(e: React.FormEvent) {
    e.preventDefault()
    if (activeWorkspaceId == null) return
    const email = inviteEmail.trim().toLowerCase()
    if (!email) return

    setSubmittingInvite(true)
    setActionError('')
    setActionInfo('')
    try {
      await api.addMemberByEmail(activeWorkspaceId, email, 'member')
      setActionInfo(`Membre ajoute: ${email}`)
      setInviteEmail('')
      await handleSearch(searchQuery)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Impossible d inviter ce membre.')
    } finally {
      setSubmittingInvite(false)
    }
  }

  async function handleRequestByEmail(e: React.FormEvent) {
    e.preventDefault()
    if (activeWorkspaceId == null) return
    const email = requestEmail.trim().toLowerCase()
    if (!email) return

    setSubmittingRequest(true)
    setActionError('')
    setActionInfo('')
    try {
      await api.sendFriendRequestByEmail(activeWorkspaceId, email)
      setActionInfo(`Demande d ami envoyee: ${email}`)
      setRequestEmail('')
      await loadRequests()
      await handleSearch(searchQuery)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Impossible d envoyer la demande d ami.')
    } finally {
      setSubmittingRequest(false)
    }
  }

  async function handleSendRequest(user: SearchUser) {
    if (activeWorkspaceId == null) return
    setActionError('')
    setActionInfo('')
    try {
      if (user.email) await api.sendFriendRequestByEmail(activeWorkspaceId, user.email)
      else await api.sendFriendRequest(activeWorkspaceId, user.id)
      await loadRequests()
      await handleSearch(searchQuery)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Impossible d envoyer la demande d ami.')
    }
  }

  async function handleRespond(requestId: number, action: 'accept' | 'decline') {
    if (!activeWorkspaceId) return
    setActionError('')
    setActionInfo('')
    try {
      await api.respondFriendRequest(activeWorkspaceId, requestId, action)
      await loadRequests()
      await loadFriends()
      await handleSearch(searchQuery)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Impossible de repondre a la demande.')
    }
  }

  async function openDm(userId: number, existingDmId?: number | null) {
    if (activeWorkspaceId == null) return
    setActionError('')
    setActionInfo('')
    try {
      let dmId = firstNumber(existingDmId)
      if (!dmId) {
        const data = await api.openDm(activeWorkspaceId, userId) as any
        dmId = firstNumber(data?.dmId, data?.id, data?.dm?.id)
      }
      if (dmId) {
        setActiveThread({ type: 'dm', id: dmId })
      } else {
        setActionError('Impossible d ouvrir la conversation DM.')
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Impossible d ouvrir la conversation DM.')
    }
  }

  const tabClass = (t: Tab) =>
    `px-3 py-1.5 text-xs font-medium rounded-lg transition ${tab === t
      ? 'bg-white/10 text-zinc-100'
      : 'text-zinc-500 hover:text-zinc-300'}`

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full bg-[#1a1b1a]">
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-zinc-400">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          <span className="text-sm font-semibold text-zinc-100">Amis</span>
          {requests.length > 0 && (
            <span className="ml-auto h-5 min-w-5 px-1.5 rounded-full bg-indigo-500 text-[11px] font-semibold text-white flex items-center justify-center">
              {requests.length}
            </span>
          )}
        </div>

        <div className="flex gap-1">
          <button className={tabClass('friends')} onClick={() => setTab('friends')}>
            Amis {friends.length > 0 && `(${friends.length})`}
          </button>
          <button className={tabClass('requests')} onClick={() => setTab('requests')}>
            Demandes {requests.length > 0 && `(${requests.length})`}
          </button>
          <button className={tabClass('search')} onClick={() => setTab('search')}>
            Recherche
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'friends' && (
          <div className="p-2">
            {friends.length === 0
              ? <p className="text-xs text-zinc-600 text-center py-8">Aucun ami pour le moment.</p>
              : friends.map(f => (
                <div key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 group transition">
                  <Avatar username={f.username} avatar={f.avatar} />
                  <span className="flex-1 text-sm text-zinc-200 truncate">{f.username}</span>
                  <button
                    onClick={() => openDm(f.id, f.dmId)}
                    className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-zinc-200 transition"
                    title="Envoyer un message"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </button>
                </div>
              ))}
          </div>
        )}

        {tab === 'requests' && (
          <div className="p-2">
            {requests.length === 0
              ? <p className="text-xs text-zinc-600 text-center py-8">Aucune demande en attente.</p>
              : requests.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition">
                  <Avatar username={r.username} avatar={r.avatar} />
                  <span className="flex-1 text-sm text-zinc-200 truncate">{r.username}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleRespond(r.id, 'accept')}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 transition"
                      title="Accepter"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRespond(r.id, 'decline')}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition"
                      title="Refuser"
                    >
                      <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                        <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === 'search' && (
          <div className="p-3 space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
              <form onSubmit={handleInviteMemberByEmail} className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="Inviter au workspace (email)"
                  className="flex-1 rounded-lg border border-white/10 bg-[#111214] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingInvite || !inviteEmail.trim()}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-zinc-200 bg-white/10 hover:bg-white/15 disabled:opacity-40"
                >
                  {submittingInvite ? '...' : 'Inviter'}
                </button>
              </form>

              <form onSubmit={handleRequestByEmail} className="flex gap-2">
                <input
                  type="email"
                  value={requestEmail}
                  onChange={e => setRequestEmail(e.target.value)}
                  placeholder="Demande d ami (email)"
                  className="flex-1 rounded-lg border border-white/10 bg-[#111214] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingRequest || !requestEmail.trim()}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-zinc-200 bg-indigo-500/60 hover:bg-indigo-500/75 disabled:opacity-40"
                >
                  {submittingRequest ? '...' : 'Ajouter'}
                </button>
              </form>

              {actionError && <p className="text-xs text-red-400">{actionError}</p>}
              {actionInfo && <p className="text-xs text-emerald-400">{actionInfo}</p>}
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Filtrer les users du workspace..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none transition"
            />

            {loading && <p className="text-xs text-zinc-600 text-center py-4">Recherche...</p>}

            {searchResults.map(u => {
              const isFriend = u.friendStatus === 'friend' || u.friendStatus === 'accepted'
              const isPendingSent = u.friendStatus === 'pending_sent' || u.friendStatus === 'outgoing_pending'
              const isPendingReceived = u.friendStatus === 'pending_received' || u.friendStatus === 'incoming_pending'

              return (
                <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition">
                  <Avatar username={u.username} avatar={u.avatar} />
                  <span className="flex-1 text-sm text-zinc-200 truncate">{u.username}</span>

                  {isFriend && (
                    <button
                      onClick={() => openDm(u.id, u.dmId)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition px-2 py-1 rounded-lg hover:bg-indigo-500/10"
                    >
                      Message
                    </button>
                  )}

                  {u.friendStatus === 'none' && (
                    <button
                      onClick={() => handleSendRequest(u)}
                      className="text-xs text-zinc-400 hover:text-zinc-200 transition px-2 py-1 rounded-lg hover:bg-white/10"
                    >
                      + Ajouter
                    </button>
                  )}

                  {isPendingSent && (
                    <span className="text-xs text-zinc-600 px-2">Envoyee</span>
                  )}

                  {isPendingReceived && (
                    <button
                      onClick={() => u.friendRequestId && handleRespond(u.friendRequestId, 'accept')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition px-2 py-1 rounded-lg hover:bg-emerald-500/10"
                    >
                      Accepter
                    </button>
                  )}
                </div>
              )
            })}

            {!loading && searchResults.length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-6">Aucun utilisateur trouve.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Avatar({ username, avatar }: { username: string; avatar?: string | null }) {
  const imageUrl = resolveAvatarImageUrl(avatar, 64)
  return (
    <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-white/10 text-zinc-400 text-xs font-semibold">
      {imageUrl
        ? <img src={imageUrl} alt={username} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        : username.slice(0, 2).toUpperCase()
      }
    </div>
  )
}



