import { useEffect, useState } from 'react'
import { useSessionStore } from '../store/useSessionStore'
import { useAppStore } from '../store/useAppStore'
import * as api from '../api/messaging'

type Props = {
  onClose: () => void
  onCreated: () => void
}

export default function CreateWorkspaceModal({ onClose, onCreated }: Props) {
  const cookie = useSessionStore(s => s.cookie)
  const setWorkspaces = useAppStore(s => s.setWorkspaces)
  const [name, setName] = useState('')
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Le nom est requis.')

    setLoading(true)
    setError('')
    try {
      const data = await api.createWorkspace(cookie, name.trim()) as any
      const workspaceId = data?.workspaceId ?? data?.id ?? data?.workspace?.id

      if (iconFile && workspaceId) {
        await api.uploadWorkspaceIcon(cookie, workspaceId, iconFile)
      }

      const listData = await api.listWorkspaces(cookie) as any
      const raw = listData?.items ?? listData?.workspaces ?? []
      setWorkspaces(raw.map((entry: any) => {
        const w = entry.workspace ?? entry
        return { id: w.id, name: w.name, icon: w.icon ?? null, ownerId: w.ownerId }
      }))

      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur creation.')
    } finally {
      setLoading(false)
    }
  }

  function convertToBase64(file: File) {
    if (!file.type.startsWith('image/')) return setError('Fichier invalide, image uniquement.')
    if (file.size > 2 * 1024 * 1024) return setError('Image trop lourde, max 2MB.')

    setIconFile(file)
    setIconPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(file)
    })
    setError('')
  }

  useEffect(() => {
    return () => {
      if (iconPreview) URL.revokeObjectURL(iconPreview)
    }
  }, [iconPreview])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#17181a] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">Creer un workspace</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-white/10 hover:text-zinc-200 transition"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-widest text-zinc-500">
              Nom du workspace
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Mon serveur"
              maxLength={120}
              disabled={loading}
              className="w-full rounded-lg border border-white/10 bg-[#111214] px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none transition"
            />
            <p className="text-[11px] text-zinc-600">{name.length}/120</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-widest text-zinc-500">
              Icone <span className="normal-case text-zinc-600">(optionnel)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) convertToBase64(file)
              }}
              disabled={loading}
              className="w-full rounded-lg border border-white/10 bg-[#111214] px-3 py-2 text-sm text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-500 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-indigo-400"
            />
            <p className="text-[11px] text-zinc-600">PNG/JPG, max 2MB</p>
            {iconPreview && (
              <img
                src={iconPreview}
                alt="Apercu icone"
                className="h-14 w-14 rounded-lg border border-white/10 object-cover"
              />
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Creation...' : 'Creer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
