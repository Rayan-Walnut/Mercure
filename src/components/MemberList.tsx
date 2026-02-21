import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useSessionStore } from '../store/useSessionStore'
import * as api from '../api/messaging'

// Structure retournée par /workspaces/members/list
type WorkspaceMember = {
  userId: number
  workspaceId: number
  role: string
  user?: {
    id: number
    username: string
    handle?: string | null
    email: string
    avatar?: string | null
    createdAt?: string | null
  }
}

type Props = {
  width?: number
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user, size = 28, online }: {
  user: WorkspaceMember['user']
  size?: number
  online: boolean
}) {
  const initials = (user?.username ?? '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const hue = useMemo(() => {
    const str = user?.username ?? 'x'
    let h = 0
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360
    return h
  }, [user?.username])

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.username}
          className="rounded-full object-cover w-full h-full"
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center text-white font-semibold select-none"
          style={{
            width: size,
            height: size,
            background: `hsl(${hue} 50% 36%)`,
            fontSize: size * 0.36,
          }}
        >
          {initials}
        </div>
      )}

      {/* Indicateur présence */}
      <span
        className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-[#1a1b1a] transition-colors duration-300"
        style={{
          width: size * 0.38,
          height: size * 0.38,
          background: online ? '#22c55e' : '#3f3f46',
        }}
      />
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function MemberSkeleton() {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1 animate-pulse">
      <div className="w-7 h-7 rounded-full bg-white/5 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-20 rounded bg-white/5" />
        <div className="h-2 w-12 rounded bg-white/[0.03]" />
      </div>
    </div>
  )
}

// ─── Row membre ───────────────────────────────────────────────────────────────

function MemberRow({ member, online }: { member: WorkspaceMember; online: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 px-2 py-1 rounded-lg cursor-default transition-colors duration-100
      hover:bg-white/[0.05]`}
    >
      <Avatar user={member.user} size={28} online={online} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 min-w-0">
          <span className={`text-[13px] leading-5 truncate font-medium transition-colors duration-150
            ${online ? 'text-zinc-200' : 'text-zinc-500'}`}
          >
            {member.user?.username ?? `User ${member.userId}`}
          </span>

          {member.role === 'admin' && (
            <svg
              width="9" height="9" viewBox="0 0 24 24" fill="currentColor"
              className="text-amber-400/60 shrink-0 mb-px"
              title="Admin"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          )}
        </div>

        {member.user?.handle && (
          <p className={`text-[11px] truncate leading-4 ${online ? 'text-zinc-500' : 'text-zinc-600'}`}>
            @{member.user.handle}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Section (En ligne / Hors ligne) ─────────────────────────────────────────

function Section({ label, members, online, defaultOpen = true }: {
  label: string
  members: WorkspaceMember[]
  online: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (members.length === 0) return null

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-1.5 px-1 py-1 group"
      >
        <svg
          width="10" height="10" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className={`text-zinc-600 transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 group-hover:text-zinc-300 transition truncate">
          {label} — {members.length}
        </span>
      </button>

      {open && (
        <div className="space-y-0.5">
          {members.map(m => (
            <MemberRow key={m.userId} member={m} online={online} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function MemberList({ width }: Props) {
  const activeWorkspaceId = useAppStore(s => s.activeWorkspaceId)
  const cookie = useSessionStore(s => s.cookie)
  const onlineUserIds = useAppStore(s => s.onlineUserIds)
  const lastWsEvent = useAppStore(s => s.lastWsEvent)
  const setOnlineUserIds = useAppStore(s => s.setOnlineUserIds)

  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(false)

  // Charger membres + présence initiale
  useEffect(() => {
    if (!activeWorkspaceId) { setMembers([]); return }
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [membersRes, onlineRes] = await Promise.all([
          api.listMembers(cookie, activeWorkspaceId!),
          api.onlineMembers(cookie, activeWorkspaceId!),
        ])
        if (cancelled) return
        setMembers(membersRes.items ?? [])
        setOnlineUserIds(new Set<number>(onlineRes.onlineUserIds ?? []))
      } catch {
        // silencieux
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [activeWorkspaceId, cookie])

  // Mettre à jour la présence en temps réel via WS
  useEffect(() => {
    if (!lastWsEvent || lastWsEvent['type'] !== 'presence') return
    if (lastWsEvent['workspaceId'] !== activeWorkspaceId) return

    const uid = lastWsEvent['userId'] as number
    const isOnline = lastWsEvent['online'] as boolean

    setOnlineUserIds(prev => {
      const next = new Set(prev)
      isOnline ? next.add(uid) : next.delete(uid)
      return next
    })
  }, [lastWsEvent, activeWorkspaceId])

  const { online, offline } = useMemo(() => {
    const sortMembers = (a: WorkspaceMember, b: WorkspaceMember) => {
      if (a.role !== b.role) return a.role === 'admin' ? -1 : 1
      return (a.user?.username ?? '').localeCompare(b.user?.username ?? '')
    }

    const online: WorkspaceMember[] = []
    const offline: WorkspaceMember[] = []

    for (const m of members) {
      if (onlineUserIds.has(m.userId)) online.push(m)
      else offline.push(m)
    }

    return {
      online: online.sort(sortMembers),
      offline: offline.sort(sortMembers),
    }
  }, [members, onlineUserIds])

  return (
    <aside
      style={width ? { width: `${width}px` } : undefined}
      className="shrink-0 flex flex-col bg-[#1a1b1a] border-l border-white/[0.06]"
    >
      {/* Header */}
      <div className="shrink-0 px-3 pt-4 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Membres
        </span>
      </div>

      {/* Liste scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 pb-4 space-y-1 sidebar-scroll">
        {loading && members.length === 0 ? (
          <div className="space-y-1 pt-1">
            {[...Array(5)].map((_, i) => <MemberSkeleton key={i} />)}
          </div>
        ) : (
          <>
            <Section label="En ligne" members={online} online defaultOpen />
            <Section label="Hors ligne" members={offline} online={false} defaultOpen={false} />
            {!loading && members.length === 0 && (
              <p className="px-2 text-xs text-zinc-600 pt-2">Aucun membre</p>
            )}
          </>
        )}
      </div>
    </aside>
  )
}