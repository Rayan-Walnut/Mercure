import { useState } from 'react'
import { useSessionStore } from '../store/useSessionStore'
import * as api from '../api/messaging'

type Props = {
  workspaceId: number
  onClose: () => void
  onCreated: (channelId: number | null) => void | Promise<void>
}

export default function CreateChannelModal({ workspaceId, onClose, onCreated }: Props) {
  const cookie = useSessionStore(s => s.cookie)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextName = name.trim()
    if (!nextName) {
      setError('Le nom du canal est requis.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await api.createChannel(cookie, workspaceId, nextName) as any
      const createdChannelId = data?.channelId ?? data?.id ?? data?.channel?.id ?? null
      await onCreated(createdChannelId)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de creer le canal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#17181a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">Creer un canal</h2>
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
              Nom du canal
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: annonces"
              maxLength={80}
              autoFocus
              disabled={loading}
              className="w-full rounded-lg border border-white/10 bg-[#111214] px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none transition"
            />
            <p className="text-[11px] text-zinc-600">{name.length}/80</p>
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
