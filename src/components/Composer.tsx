import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useSessionStore } from '../store/useSessionStore'
import { useWorkspace } from '../hooks/useWorkspace'
import * as api from '../api/messaging'

export default function Composer() {
  const cookie = useSessionStore(s => s.cookie)
  const activeThread = useAppStore(s => s.activeThread)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const { loadMessages } = useWorkspace()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || !activeThread) return

    setSending(true)
    try {
      await api.sendMessage(
        cookie,
        content.trim(),
        activeThread.type === 'channel' ? activeThread.id : undefined,
        activeThread.type === 'dm' ? activeThread.id : undefined,
      )
      setContent('')
      await loadMessages()
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="px-4 py-3 border-t border-white/[0.06]">
      <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5">
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          placeholder="Envoie un message..."
          className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="text-indigo-400 hover:text-indigo-300 disabled:opacity-30 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  )
}