import { useState } from 'react'
import { useSessionStore } from '../store/useSessionStore'
import { useAppStore } from '../store/useAppStore'
import CreateWorkspaceModal from './CreateWorkspaceModal'

type Props = { onWorkspaceSelect: (id: number) => void }

export default function WorkspaceRail({ onWorkspaceSelect }: Props) {
  const workspaces = useAppStore(s => s.workspaces)
  const activeWorkspaceId = useAppStore(s => s.activeWorkspaceId)
  const setActiveWorkspace = useAppStore(s => s.setActiveWorkspace)
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <aside className="w-[70px] flex flex-col items-center py-4 gap-2 bg-[#0f0f0f] border-r border-white/[0.04]">

        {/* Logo */}
        <div className="mb-2">
          <img src="/logo.jpg" alt="Mercure" className="h-8 w-8 rounded-lg object-cover opacity-80" />
        </div>

        <div className="w-8 h-px bg-white/[0.06] rounded-full mb-1" />

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
                {/* Indicateur actif */}
                <span className={`absolute -left-3 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-white transition-all duration-200
                  ${isActive ? 'h-6 opacity-100' : 'h-3 opacity-0 group-hover:opacity-40 group-hover:h-4'}`}
                />

                <div className={`w-full aspect-square rounded-2xl flex items-center justify-center text-xs font-bold overflow-hidden transition-all duration-200
                  ${isActive
                    ? 'rounded-[14px] bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
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

        {/* Add */}
        <div className="mt-auto px-3 w-full">
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
    </>
  )
}