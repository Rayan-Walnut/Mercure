import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'

export default function MessageList() {
  const messages = useAppStore(s => s.messages)
  const membersById = useAppStore(s => s.membersById)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function formatTime(value?: string) {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-zinc-600">
        Aucun message pour le moment.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      {messages.map(msg => {
        const author = msg.senderId ? (membersById.get(msg.senderId)?.username ?? `User ${msg.senderId}`) : 'Inconnu'
        return (
          <div key={msg.id}>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-zinc-200">{author}</span>
              <span className="text-[11px] text-zinc-600">{formatTime(msg.createdAt)}</span>
            </div>
            <p className="mt-0.5 text-sm text-zinc-300 whitespace-pre-wrap">{msg.content}</p>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}