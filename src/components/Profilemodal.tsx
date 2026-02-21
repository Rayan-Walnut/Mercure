import { useState, useRef, useEffect } from 'react'
import { useSessionStore } from '../store/useSessionStore'
import { getAccountInfo } from '../api/auth'
import { resolveAvatarUrl } from '../utils/avatar'

const UPLOAD_BASE = 'https://upload.astracode.dev'

type Props = {
  onClose: () => void
  onLogout: () => void
}

type NavItem = 'profil' | 'compte'

export default function ProfileModal({ onClose, onLogout }: Props) {
  const user = useSessionStore(s => s.user)
  const setSession = useSessionStore(s => s.setSession)
  const cookie = useSessionStore(s => s.cookie)

  const [nav, setNav] = useState<NavItem>('profil')
  const [avatarUrl, setAvatarUrl] = useState(resolveAvatarUrl(user?.avatar) || '')
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const displayName = [user?.prenom, user?.nom].filter(Boolean).join(' ') || user?.username || user?.email || 'Utilisateur'
  const initials = displayName.slice(0, 2).toUpperCase()

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function uploadFile(file: File) {
    setUploading(true)
    setNotice('')
    try {
      const form = new FormData()
      form.append('cookie', cookie)
      form.append('file', file)
      const res = await fetch(`${UPLOAD_BASE}/upload/avatar`, { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.detail ?? 'Erreur upload')
      const newAvatar = data.avatar_url ?? data.url ?? null
      await refreshSession(newAvatar ?? undefined)
      setNotice('✓ Photo mise à jour')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Erreur upload')
    } finally {
      setUploading(false)
    }
  }

  async function refreshSession(newAvatar?: string) {
    try {
      const info = await getAccountInfo(cookie) as any
      const nextAvatar =
        resolveAvatarUrl(info.avatar) ??
        resolveAvatarUrl(info.avatar_url) ??
        resolveAvatarUrl(newAvatar) ??
        resolveAvatarUrl(user?.avatar) ??
        undefined

      setSession(cookie, {
        email: info.email ?? user?.email,
        nom: info.nom,
        prenom: info.prenom,
        avatar: nextAvatar,
        handle: info.handle,
        username: info.handle,
      })
      setAvatarUrl(nextAvatar ?? '')
    } catch { }
  }

  const navItems = [
    { id: 'profil' as NavItem, label: 'Mon compte' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex bg-[#111211]/95 backdrop-blur-sm">

      {/* Sidebar gauche */}
      <div className="w-[220px] flex flex-col px-3 py-8 shrink-0 border-r border-white/[0.06]">
        {/* User info */}
        <div className="flex items-center gap-2.5 px-2 mb-6">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-8 w-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-xs font-semibold shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-200 truncate">{displayName}</p>
            {user?.handle && <p className="text-[10px] text-zinc-600 truncate">@{user.handle}</p>}
          </div>
        </div>

        {/* Nav */}
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600 px-2 mb-1">Paramètres</p>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setNav(item.id)}
            className={`w-full text-left px-2 py-1.5 rounded-lg text-[13px] transition-colors mb-0.5
              ${nav === item.id
                ? 'bg-white/[0.08] text-zinc-100'
                : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
              }`}
          >
            {item.label}
          </button>
        ))}

        {/* Déconnexion en bas */}
        <div className="mt-auto">
          <div className="h-px bg-white/[0.06] mb-3" />
          <button
            onClick={() => { onClose(); onLogout() }}
            className="w-full text-left px-2 py-1.5 rounded-lg text-[13px] text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto px-10 py-12">

          {/* Bannière profil */}
          <div className="rounded-2xl overflow-hidden mb-6 border border-white/[0.06]">
            {/* Banner */}
            <div className="h-24 bg-gradient-to-br from-indigo-600/40 via-purple-700/30 to-zinc-900 relative">
              <div className="absolute bottom-0 left-6 translate-y-1/2 flex items-end gap-4">
                {/* Avatar */}
                <div className="relative group">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-20 w-20 rounded-full object-cover border-4 border-[#111211]" />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-2xl font-semibold border-4 border-[#111211]">
                      {initials}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Infos sous la bannière */}
            <div className="bg-[#1a1b1a] pt-14 px-6 pb-6">
              <h2 className="text-xl font-bold text-zinc-100">{displayName}</h2>
              {user?.handle && <p className="text-sm text-zinc-500">@{user.handle}</p>}
              <p className="text-xs text-zinc-600 mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Section photo de profil */}
          <div className="bg-[#1a1b1a] rounded-2xl border border-white/[0.06] p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">Photo de profil</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Clique sur ton avatar ou dépose une image ci-dessous.</p>
            </div>

            {/* Drop zone */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={async e => {
                e.preventDefault()
                setDragOver(false)
                const file = e.dataTransfer.files?.[0]
                if (file) await uploadFile(file)
              }}
              disabled={uploading}
              className={`w-full py-4 rounded-xl border border-dashed text-sm transition-all duration-200 flex flex-col items-center gap-2
                ${dragOver
                  ? 'border-indigo-400/60 bg-indigo-500/10 text-indigo-300'
                  : 'border-white/[0.08] text-zinc-500 hover:border-white/20 hover:text-zinc-300 hover:bg-white/[0.02]'
                }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span>{uploading ? 'Upload en cours...' : 'Glisse une image ou clique pour choisir'}</span>
              <span className="text-xs text-zinc-600">PNG, JPG, WEBP, GIF</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0]
                if (file) await uploadFile(file)
                e.currentTarget.value = ''
              }}
            />

            {notice && (
              <p className={`text-xs ${notice.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
                {notice}
              </p>
            )}
          </div>

          {/* Infos compte */}
          <div className="mt-4 bg-[#1a1b1a] rounded-2xl border border-white/[0.06] divide-y divide-white/[0.04]">
            {[
              { label: 'Nom d\'utilisateur', value: user?.handle ? `@${user.handle}` : '—' },
              { label: 'Email', value: user?.email ?? '—' },
              { label: 'Nom complet', value: [user?.prenom, user?.nom].filter(Boolean).join(' ') || '—' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-6 py-4">
                <span className="text-xs text-zinc-500">{row.label}</span>
                <span className="text-sm text-zinc-200">{row.value}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 h-8 w-8 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
