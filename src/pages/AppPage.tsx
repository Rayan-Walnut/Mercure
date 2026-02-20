import { useEffect, useRef, useState } from 'react'
import { useSessionStore } from '../store/useSessionStore'
import { useAppStore } from '../store/useAppStore'
import { useWorkspace } from '../hooks/useWorkspace'
import { connectWebSocket, disconnect, subscribeCurrentThread } from '../services/websocket'
import WorkspaceRail from '../components/WorkspaceRail'
import Sidebar from '../components/Sidebar'
import MessageList from '../components/MessageList'
import Composer from '../components/Composer'

export default function AppPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [isResizingSidebar, setIsResizingSidebar] = useState(false)
  const centerRef = useRef<HTMLElement | null>(null)
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const cookie = useSessionStore(s => s.cookie)
  const clearSession = useSessionStore(s => s.clearSession)
  const activeWorkspaceId = useAppStore(s => s.activeWorkspaceId)
  const activeThread = useAppStore(s => s.activeThread)
  const setActiveWorkspace = useAppStore(s => s.setActiveWorkspace)
  const setActiveThread = useAppStore(s => s.setActiveThread)

  const { loadWorkspaces, loadWorkspaceScope, loadMessages } = useWorkspace()

  // Init WS
  useEffect(() => {
    connectWebSocket(cookie)
    return () => disconnect(true)
  }, [cookie])

  // Subscribe thread quand il change
  useEffect(() => {
    if (!activeThread) return
    subscribeCurrentThread()
    loadMessages()
  }, [activeThread?.type, activeThread?.id])

  // Charger les workspaces au démarrage
  useEffect(() => {
    loadWorkspaces()
  }, [])

  // Charger le scope quand le workspace actif change
  useEffect(() => {
    if (!activeWorkspaceId) return
    loadWorkspaceScope(activeWorkspaceId).then(({ channels, dms }) => {
      const thread = useAppStore.getState().activeThread
      const stillValid =
        thread?.type === 'channel'
          ? channels.some(c => c.id === thread.id)
          : thread?.type === 'dm'
            ? dms.some(d => d.id === thread.id)
            : false

      if (!stillValid) {
        if (channels[0]) setActiveThread({ type: 'channel', id: channels[0].id })
        else if (dms[0]) setActiveThread({ type: 'dm', id: dms[0].id })
        else setActiveThread(null)
      }
    })
  }, [activeWorkspaceId])

  function handleLogout() {
    clearSession()
    disconnect(true)
  }

  function clampSidebarWidth(nextWidth: number) {
    const sectionWidth = centerRef.current?.clientWidth ?? 1000
    const minWidth = 210
    const maxWidth = Math.max(320, sectionWidth - 380)
    return Math.max(minWidth, Math.min(maxWidth, nextWidth))
  }

  function handleResizeStart(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault()
    resizeRef.current = { startX: e.clientX, startWidth: sidebarWidth }
    setIsResizingSidebar(true)
  }

  useEffect(() => {
    if (!isResizingSidebar) return

    const prevCursor = document.body.style.cursor
    const prevUserSelect = document.body.style.userSelect
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (e: MouseEvent) => {
      const state = resizeRef.current
      if (!state) return
      const nextWidth = state.startWidth + (e.clientX - state.startX)
      setSidebarWidth(clampSidebarWidth(nextWidth))
    }

    const handleMouseUp = () => {
      resizeRef.current = null
      setIsResizingSidebar(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = prevCursor
      document.body.style.userSelect = prevUserSelect
    }
  }, [isResizingSidebar])

  return (
    <div className="h-screen bg-[#131413] text-zinc-100 flex flex-col overflow-hidden">

      {/* Titlebar */}
      <header className="h-9 shrink-0 flex items-center justify-between px-3 bg-[#131413] [-webkit-app-region:drag]">
        <div className="flex items-center gap-2 px-1 py-1">
          <img src="/logo.jpg" alt="Mercure" className="h-6 w-6 rounded-md object-cover" />
          <span className="text-[13px] font-semibold text-zinc-300">Mercure</span>
        </div>
      </header>

      <main className="flex flex-1 min-h-0 overflow-hidden">

        {/* Rail workspaces */}
        <WorkspaceRail onWorkspaceSelect={async (id) => {
          setActiveWorkspace(id)
        }} />

        {/* Zone centrale */}
        <section ref={centerRef} className="flex flex-1 min-w-0 rounded-tl-2xl border border-zinc-700/40 bg-[#1a1b1a] overflow-hidden">

          {/* Sidebar */}
          <Sidebar onLogout={handleLogout} width={sidebarWidth} />

          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionner la sidebar"
            onMouseDown={handleResizeStart}
            className={`group relative w-1.5 shrink-0 cursor-col-resize bg-transparent transition-colors ${
              isResizingSidebar ? 'bg-indigo-400/15' : 'hover:bg-indigo-400/10'
            }`}
          >
            <span
              className={`pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-px transition-colors ${
                isResizingSidebar ? 'bg-indigo-400/70' : 'bg-white/[0.08] group-hover:bg-indigo-300/60'
              }`}
            />
          </div>

          {/* Thread */}
          <div className="flex flex-col flex-1 min-w-0">
            {activeThread ? (
              <>
                <MessageList />
                <Composer />
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center opacity-20">
                <div className="flex flex-col items-center gap-3">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  <p className="text-sm text-zinc-400">Sélectionne une discussion</p>
                </div>
              </div>
            )}
          </div>

        </section>
      </main>
    </div>
  )
}
