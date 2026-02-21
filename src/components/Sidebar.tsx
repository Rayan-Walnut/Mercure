import { useState, useMemo, useRef, useEffect } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppStore } from '../store/useAppStore'
import { useWorkspace } from '../hooks/useWorkspace'
import * as api from '../api/messaging'
import CreateChannelModal from './CreateChannelModal'

type Props = { onLogout: () => void; width?: number }
type Channel = { id: number; workspaceId: number; name: string; isPrivate?: boolean; category?: string | null; position?: number }

const UNCATEGORIZED = '__uncategorized__'

// ─── Menu contextuel ⋯ ────────────────────────────────────────────────────────

function ChannelMenu({ onRename, onDelete, onClose }: {
  onRename: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div ref={ref} className="absolute right-0 top-6 z-50 w-40 rounded-lg border border-white/10 bg-[#1e1f1e] shadow-xl py-1">
      <button
        onClick={() => { onRename(); onClose() }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-zinc-300 hover:bg-white/5 hover:text-zinc-100 transition"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Renommer
      </button>
      <div className="my-1 border-t border-white/5" />
      <button
        onClick={() => { onDelete(); onClose() }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
        </svg>
        Supprimer
      </button>
    </div>
  )
}

// ─── Canal avec rename inline ─────────────────────────────────────────────────

function SortableChannel({ ch, isActive, onClick, onDelete, onRenamed }: {
  ch: Channel
  isActive: boolean
  onClick: () => void
  onDelete: () => void
  onRenamed: (newName: string) => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(ch.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `ch-${ch.id}`,
    data: { type: 'channel', channel: ch },
  })

  function startEdit() {
    setEditValue(ch.name)
    setEditing(true)
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 10)
  }

  async function commitEdit() {
    const trimmed = editValue.trim()
    if (!trimmed || trimmed === ch.name) { setEditing(false); return }
    try {
      await (api as any).renameChannel(ch.id, trimmed)
      onRenamed(trimmed)
    } catch {
      setEditValue(ch.name)
    }
    setEditing(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') { setEditValue(ch.name); setEditing(false) }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative group flex items-center rounded-lg transition
        ${isDragging ? 'opacity-40' : ''}
        ${isActive ? 'bg-white/10 border-white/10' : 'hover:bg-white/5'}`}
    >
      {/* Grip drag */}
      <button
        {...attributes}
        {...listeners}
        tabIndex={-1}
        className="pl-2 pr-1 py-1.5 text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
          <circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>
          <circle cx="2" cy="6" r="1.2"/><circle cx="6" cy="6" r="1.2"/>
          <circle cx="2" cy="10" r="1.2"/><circle cx="6" cy="10" r="1.2"/>
        </svg>
      </button>

      {/* Nom / input inline */}
      <div className="flex-1 min-w-0 py-1 px-1">
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={onKeyDown}
            className="w-full bg-[#111214] border border-indigo-500/60 rounded px-1.5 py-0 text-[13px] text-zinc-100 focus:outline-none"
            maxLength={80}
          />
        ) : (
          <button
            onClick={onClick}
            onDoubleClick={startEdit}
            className={`w-full text-left text-[13px] leading-5 ${isActive ? 'text-zinc-100' : 'text-zinc-300 group-hover:text-zinc-100'}`}
          >
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <span className="text-zinc-400">#</span>
              <span className="truncate">{ch.name}</span>
              {ch.isPrivate && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 shrink-0">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              )}
            </span>
          </button>
        )}
      </div>

      {/* Bouton ⋯ */}
      {!editing && (
        <button
          onClick={e => { e.stopPropagation(); setShowMenu(v => !v) }}
          className="pr-2 pl-1 py-1.5 text-zinc-400 hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition shrink-0"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
          </svg>
        </button>
      )}

      {showMenu && (
        <ChannelMenu
          onRename={() => { startEdit() }}
          onDelete={onDelete}
          onClose={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}

// ─── Modal suppression ────────────────────────────────────────────────────────

function DeleteModal({ ch, onDone, onClose }: {
  ch: Channel; onDone: () => void; onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  async function handleDelete() {
    setLoading(true)
    try { await (api as any).deleteChannel(ch.id); onDone() } catch {}
    setLoading(false)
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#17181a]" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-red-400">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">Supprimer #{ch.name} ?</p>
              <p className="text-xs text-zinc-400 mt-0.5">Action irréversible. Tous les messages seront perdus.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} disabled={loading} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 transition">Annuler</button>
            <button onClick={handleDelete} disabled={loading} className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-400 disabled:opacity-50 transition">
              {loading ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar({ onLogout, width }: Props) {
  const channels = useAppStore(s => s.channels)
  const setChannels = useAppStore(s => s.setChannels)
  const workspaces = useAppStore(s => s.workspaces)
  const activeWorkspaceId = useAppStore(s => s.activeWorkspaceId)
  const activeThread = useAppStore(s => s.activeThread)
  const scopeLoading = useAppStore(s => s.scopeLoading)
  const setActiveThread = useAppStore(s => s.setActiveThread)
  const { loadWorkspaceScope } = useWorkspace()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [draggingChannel, setDraggingChannel] = useState<Channel | null>(null)
  const [deleting, setDeleting] = useState<Channel | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  // Channels triés et groupés
  const sortedChannels = useMemo(() =>
    [...channels].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [channels]
  )

  const grouped = useMemo(() =>
    sortedChannels.reduce<Record<string, Channel[]>>((acc, ch) => {
      const key = ch.category ?? UNCATEGORIZED
      if (!acc[key]) acc[key] = []
      acc[key].push(ch)
      return acc
    }, {}),
    [sortedChannels]
  )

  const categoryKeys = useMemo(() => {
    const named = Object.keys(grouped).filter(k => k !== UNCATEGORIZED).sort()
    return [...named, ...(grouped[UNCATEGORIZED] ? [UNCATEGORIZED] : [])]
  }, [grouped])

  function toggleCategory(key: string) {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function onDragEnd(e: DragEndEvent) {
    setDraggingChannel(null)
    const { active, over } = e
    if (!over || active.id === over.id) return

    const draggedId = Number(String(active.id).replace('ch-', ''))
    const overId = Number(String(over.id).replace('ch-', ''))
    const draggedCh = channels.find(c => c.id === draggedId)
    const overCh = channels.find(c => c.id === overId)
    if (!draggedCh || !overCh) return

    const targetCategory = overCh.category ?? null

    // Reconstruire la liste complète avec le bon ordre
    // 1. Séparer les canaux par catégorie cible
    const sameGroup = sortedChannels.filter(c => (c.category ?? null) === targetCategory)
    const draggedInGroup = sameGroup.find(c => c.id === draggedId)

    let newSameGroup: Channel[]
    if (draggedInGroup) {
      // Déjà dans la même catégorie → réordonner
      const oldIndex = sameGroup.findIndex(c => c.id === draggedId)
      const newIndex = sameGroup.findIndex(c => c.id === overId)
      newSameGroup = arrayMove(sameGroup, oldIndex, newIndex)
    } else {
      // Vient d'une autre catégorie → insérer à la position de la cible
      const insertIndex = sameGroup.findIndex(c => c.id === overId)
      newSameGroup = [...sameGroup]
      newSameGroup.splice(insertIndex, 0, { ...draggedCh, category: targetCategory })
    }

    // Recalculer positions
    const updatedGroup = newSameGroup.map((c, i) => ({ ...c, category: targetCategory, position: i }))

    // Fusionner avec les autres canaux
    const otherChannels = channels
      .filter(c => (c.category ?? null) !== targetCategory && c.id !== draggedId)
    const final = [...otherChannels, ...updatedGroup]

    setChannels(final)

    // Persister
    try {
      const moved = updatedGroup.find(c => c.id === draggedId)!
      await api.updateChannel(draggedId, targetCategory ?? '', moved.position)
    } catch {
      if (activeWorkspaceId) loadWorkspaceScope(activeWorkspaceId)
    }
  }

  const workspaceName = workspaces.find(w => w.id === activeWorkspaceId)?.name ?? 'Canaux'

  return (
    <>
      <aside
        style={width ? { width: `${width}px` } : undefined}
        className="shrink-0 flex flex-col bg-[#131413]"
      >
        {/* Header fixe */}
        <div className="shrink-0 flex items-center justify-between px-3 pt-4 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-300 truncate">
            {workspaceName}
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!activeWorkspaceId}
            className="h-5 w-5 rounded-md text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.08] transition flex items-center justify-center"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Liste scrollable */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e: DragStartEvent) => setDraggingChannel(e.active.data.current?.channel ?? null)}
          onDragEnd={onDragEnd}
        >
          <div className="sidebar-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 pb-4 space-y-1">
            {channels.length === 0 && !scopeLoading && (
              <p className="px-2 text-xs text-zinc-400">Aucun canal</p>
            )}

            {categoryKeys.map(catKey => {
              const catChannels = grouped[catKey] ?? []
              const isCollapsed = collapsedCategories.has(catKey)
              const label = catKey === UNCATEGORIZED ? null : catKey

              return (
                <div key={catKey} className="space-y-0.5">
                  {label && (
                    <button onClick={() => toggleCategory(catKey)} className="w-full flex items-center gap-1 px-2 py-1 group">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                        className={`text-zinc-500 transition-transform duration-150 ${isCollapsed ? '-rotate-90' : ''}`}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 group-hover:text-zinc-200 transition truncate">
                        {label}
                      </span>
                    </button>
                  )}

                  {!isCollapsed && (
                    <SortableContext items={catChannels.map(c => `ch-${c.id}`)} strategy={verticalListSortingStrategy}>
                      {catChannels.map(ch => (
                        <SortableChannel
                          key={ch.id}
                          ch={ch}
                          isActive={activeThread?.type === 'channel' && activeThread.id === ch.id}
                          onClick={() => setActiveThread({ type: 'channel', id: ch.id })}
                          onDelete={() => setDeleting(ch)}
                          onRenamed={newName =>
                            setChannels(channels.map(c => c.id === ch.id ? { ...c, name: newName } : c))
                          }
                        />
                      ))}
                    </SortableContext>
                  )}
                </div>
              )
            })}
          </div>

          <DragOverlay>
            {draggingChannel && (
              <div className="px-2.5 py-1 text-[13px] rounded-lg bg-[#2a2b2a] border border-indigo-500/30 text-zinc-200 shadow-xl w-48">
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-zinc-300">#</span>{draggingChannel.name}
                </span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </aside>

      {showCreateModal && activeWorkspaceId && (
        <CreateChannelModal
          workspaceId={activeWorkspaceId}
          existingCategories={[...new Set(channels.map(c => c.category).filter(Boolean) as string[])]}
          onClose={() => setShowCreateModal(false)}
          onCreated={async channelId => {
            const { channels: refreshed } = await loadWorkspaceScope(activeWorkspaceId)
            if (channelId) { setActiveThread({ type: 'channel', id: channelId }); return }
            if (refreshed[0]) setActiveThread({ type: 'channel', id: refreshed[0].id })
          }}
        />
      )}

      {deleting && (
        <DeleteModal
          ch={deleting}
          onDone={() => {
            const remaining = channels.filter(c => c.id !== deleting.id)
            setChannels(remaining)
            if (activeThread?.type === 'channel' && activeThread.id === deleting.id && remaining[0])
              setActiveThread({ type: 'channel', id: remaining[0].id })
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}
