import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useSessionStore } from '../store/useSessionStore'
import CreateWorkspaceModal from './CreateWorkspaceModal'
import ProfileModal from './ProfileModal'

type Props = {
  onWorkspaceSelect: (id: number) => void
  onFriendsClick: () => void
  friendsActive: boolean
  onLogout: () => void
}

export default function WorkspaceRail({ onWorkspaceSelect, onFriendsClick, friendsActive, onLogout }: Props) {
  const workspaces = useAppStore(s => s.workspaces)
  const activeWorkspaceId = useAppStore(s => s.activeWorkspaceId)
  const setActiveWorkspace = useAppStore(s => s.setActiveWorkspace)
  const membersById = useAppStore(s => s.membersById)
  const currentUserId = useAppStore(s => s.currentUserId)
  const user = useSessionStore(s => s.user)
  const [showModal, setShowModal] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const currentMember =
    (currentUserId ? membersById.get(currentUserId) : undefined) ??
    (user?.email ? Array.from(membersById.values()).find(m => m.email?.toLowerCase() === user.email?.toLowerCase()) : undefined)

  const displayName =
    [user?.prenom, user?.nom].filter(Boolean).join(' ') ||
    currentMember?.username ||
    user?.username ||
    user?.email ||
    'Utilisateur'

  const initials = displayName.slice(0, 2).toUpperCase()
  const avatarUrl = user?.avatar || currentMember?.avatar || null

  return (
    <>
      <aside className="w-[70px] flex flex-col items-center py-4 gap-2 bg-[#0f0f0f] border-r border-white/[0.04]">
        <div className="w-full px-3 mb-1">
          <button
            onClick={onFriendsClick}
            title="Amis & messages"
            className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-200
              ${friendsActive
                ? 'bg-indigo-500 text-white rounded-[14px] shadow-lg shadow-indigo-500/20'
                : 'bg-white/[0.06] text-zinc-400 hover:bg-white/10 hover:text-zinc-200 hover:rounded-[14px]'
              }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </button>
        </div>

        <div className="w-8 h-px bg-white/[0.06] rounded-full" />

        {/* Workspaces */}
        <div className="flex flex-col items-center gap-2 w-full px-3">
          {workspaces.map(ws => {
            const isActive = ws.id === activeWorkspaceId
            return (
              <button
                key={ws.id}
                onClick={() => { setActiveWorkspace(ws.id); onWorkspaceSelect(ws.id) }}
                title={ws.name}
                className="relative w-full group"
              >
                <span className={`absolute -left-3 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-white transition-all duration-200
                  ${isActive ? 'h-6 opacity-100' : 'h-3 opacity-0 group-hover:opacity-40 group-hover:h-4'}`}
                />
                <div className={`w-full aspect-square rounded-2xl flex items-center justify-center text-xs font-bold overflow-hidden transition-all duration-200
                  ${isActive
                    ? 'rounded-[14px] bg-indigo-500 text-white shadow-lg'
                    : 'bg-white/[0.06] text-zinc-400 hover:bg-white/10 hover:text-zinc-200 hover:rounded-[14px]'
                  }`}
                >
                  {ws.icon
                    ? <img src={ws.icon} alt={ws.name} className="h-full w-full object-cover" />
                    : <span className="text-[13px]">{ws.name.slice(0, 2).toUpperCase()}</span>
                  }
                </div>
              </button>
            )
          })}
        </div>

        {/* Bottom: Profile + Add workspace */}
        <div className="mt-auto flex flex-col items-center gap-3 px-3 w-full">
          {/* Avatar profil */}
          <button
            onClick={() => setShowProfile(true)}
            title={displayName}
            className="focus:outline-none w-full flex justify-center"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-9 w-9 rounded-full object-cover border-2 border-white/10 hover:border-indigo-400/50 transition-all duration-200"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-xs font-semibold border-2 border-white/10 hover:border-indigo-400/50 transition-all duration-200">
                {initials}
              </div>
            )}
          </button>

          <div className="w-8 h-px bg-white/[0.06] rounded-full" />

          <button
            onClick={() => setShowModal(true)}
            title="Nouveau workspace"
            className="w-full aspect-square rounded-2xl flex items-center justify-center text-zinc-600 border border-dashed border-white/[0.08] hover:border-indigo-500/30 hover:text-indigo-400 hover:bg-indigo-500/5 hover:rounded-[14px] transition-all duration-200"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {showModal && (
        <CreateWorkspaceModal
          onClose={() => setShowModal(false)}
          onCreated={() => {}}
        />
      )}

      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          onLogout={onLogout}
        />
      )}
    </>
  )
}