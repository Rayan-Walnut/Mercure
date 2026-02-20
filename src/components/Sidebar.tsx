import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useSessionStore } from '../store/useSessionStore'
import { useWorkspace } from '../hooks/useWorkspace'
import CreateChannelModal from './CreateChannelModal'

type Props = { onLogout: () => void; width?: number }

export default function Sidebar({ onLogout, width }: Props) {
  const user = useSessionStore(s => s.user)
  const channels = useAppStore(s => s.channels)
  const dms = useAppStore(s => s.dms)
  const workspaces = useAppStore(s => s.workspaces)
  const activeWorkspaceId = useAppStore(s => s.activeWorkspaceId)
  const activeThread = useAppStore(s => s.activeThread)
  const scopeLoading = useAppStore(s => s.scopeLoading)
  const setActiveThread = useAppStore(s => s.setActiveThread)
  const membersById = useAppStore(s => s.membersById)
  const currentUserId = useAppStore(s => s.currentUserId)
  const { loadWorkspaceScope } = useWorkspace()
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false)

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId)
  const channelCount = channels.length
  const dmCount = dms.length
  const currentMember =
    (currentUserId ? membersById.get(currentUserId) : undefined) ??
    (user?.email ? Array.from(membersById.values()).find(m => m.email?.toLowerCase() === user.email?.toLowerCase()) : undefined)

  const displayName =
    [user?.prenom, user?.nom].filter(Boolean).join(' ') ||
    currentMember?.username ||
    user?.username ||
    user?.email ||
    'Utilisateur'
  const secondaryLabel =
    currentMember?.email ||
    user?.email ||
    ''
  const initials = displayName.slice(0, 2).toUpperCase()

  function resolveDmLabel(dm: typeof dms[0]) {
    const otherId = dm.participants.find(id => id !== currentUserId) ?? dm.participants[0]
    return membersById.get(otherId)?.username ?? `User ${otherId}`
  }

  return (
    <>
      <aside
        style={width ? { width: `${width}px` } : undefined}
        className="shrink-0 flex flex-col bg-gradient-to-b from-[#1a1b1a] to-[#171817]"
      >

      {/* Workspace name */}
      <div className="h-12 flex items-center px-4 border-b border-white/[0.06]">
        <span className="text-sm font-semibold tracking-wide truncate">{activeWorkspace?.name ?? 'Mercure'}</span>
      </div>

      <div className="sidebar-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-5">

        {/* Channels */}
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Canaux {channelCount > 0 ? `(${channelCount})` : ''}
            </span>
            <button
              onClick={() => setShowCreateChannelModal(true)}
              title="Ajouter un canal"
              disabled={!activeWorkspaceId}
              className="h-5 w-5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition flex items-center justify-center"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          {channels.length === 0 && !scopeLoading
            ? <p className="px-2 text-xs text-zinc-600">Aucun canal</p>
            : channels.map(ch => (
              <button
                key={ch.id}
                onClick={() => setActiveThread({ type: 'channel', id: ch.id })}
                className={`w-full text-left px-2.5 py-1 text-[13px] leading-5 rounded-lg transition border border-transparent
                  ${activeThread?.type === 'channel' && activeThread.id === ch.id
                    ? 'bg-white/10 text-zinc-100 border-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
              >
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <span className="text-zinc-500">#</span>
                  <span className="truncate">{ch.name}</span>
                </span>
              </button>
            ))
          }
        </div>

        {/* DMs */}
        <div className="space-y-1">
          <div className="px-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Messages directs {dmCount > 0 ? `(${dmCount})` : ''}
            </span>
          </div>
          {dms.length === 0 && !scopeLoading
            ? <p className="px-2 text-xs text-zinc-600">Aucun DM</p>
            : dms.map(dm => (
              <button
                key={dm.id}
                onClick={() => setActiveThread({ type: 'dm', id: dm.id })}
                className={`w-full text-left px-2.5 py-1 text-[13px] leading-5 rounded-lg transition border border-transparent
                  ${activeThread?.type === 'dm' && activeThread.id === dm.id
                    ? 'bg-white/10 text-zinc-100 border-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
              >
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <span className="text-zinc-500">@</span>
                  <span className="truncate">{resolveDmLabel(dm)}</span>
                </span>
              </button>
            ))
          }
        </div>
      </div>

      {/* Profile */}
      <div className="border-t border-white/[0.06] p-3 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2 min-w-0">
          {currentMember?.avatar ? (
            <img
              src={currentMember.avatar}
              alt={displayName}
              className="h-8 w-8 rounded-full object-cover border border-white/10 shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-xs font-semibold shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-200 truncate">{displayName}</p>
            {secondaryLabel && (
              <p className="text-[11px] text-zinc-500 truncate">{secondaryLabel}</p>
            )}
          </div>
        </div>
        <button onClick={onLogout} title="Déconnexion" className="text-zinc-500 hover:text-red-400 transition shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
      </aside>

      {showCreateChannelModal && activeWorkspaceId && (
        <CreateChannelModal
          workspaceId={activeWorkspaceId}
          onClose={() => setShowCreateChannelModal(false)}
          onCreated={async (channelId) => {
            const { channels: refreshedChannels } = await loadWorkspaceScope(activeWorkspaceId)
            if (channelId) {
              setActiveThread({ type: 'channel', id: channelId })
              return
            }
            if (refreshedChannels[0]) {
              setActiveThread({ type: 'channel', id: refreshedChannels[0].id })
            }
          }}
        />
      )}
    </>
  )
}
