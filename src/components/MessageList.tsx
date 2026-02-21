import { memo, useEffect, useMemo, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { resolveAvatarImageUrl } from '../utils/avatar'

function MessageList() {
  const messages = useAppStore(s => s.messages)
  const membersById = useAppStore(s => s.membersById)
  const activeThread = useAppStore(s => s.activeThread)
  const bottomRef = useRef<HTMLDivElement>(null)
  const hasScrolledForThreadRef = useRef(false)
  const prevMessageCountRef = useRef(0)
  const prevThreadKeyRef = useRef<string | null>(null)

  const threadKey = activeThread ? `${activeThread.type}:${activeThread.id}` : null

  useEffect(() => {
    if (prevThreadKeyRef.current !== threadKey) {
      hasScrolledForThreadRef.current = false
      prevMessageCountRef.current = 0
      prevThreadKeyRef.current = threadKey
    }
  }, [threadKey])

  useEffect(() => {
    if (!bottomRef.current) return
    const previousCount = prevMessageCountRef.current
    const nextCount = messages.length
    const isSingleNewMessage = hasScrolledForThreadRef.current && nextCount === previousCount + 1

    bottomRef.current.scrollIntoView({
      behavior: isSingleNewMessage ? 'smooth' : 'auto',
      block: 'end',
    })

    hasScrolledForThreadRef.current = true
    prevMessageCountRef.current = nextCount
  }, [messages])

  function formatTime(value?: string) {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDateLabel(value?: string) {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (d.toDateString() === yesterday.toDateString()) return 'Hier'
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  function isSameDay(a?: string, b?: string) {
    if (!a || !b) return false
    const da = new Date(a)
    const db = new Date(b)
    return da.toDateString() === db.toDateString()
  }

  function isSameAuthorAndClose(a: typeof messages[0], b: typeof messages[0]) {
    if (a.senderId !== b.senderId) return false
    if (!a.createdAt || !b.createdAt) return false
    const diff = Math.abs(new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return diff < 5 * 60 * 1000
  }

  const enriched = useMemo(() => {
    return messages.map((msg, i) => {
      const prev = messages[i - 1]
      const isFirstOfDay = !prev || !isSameDay(prev.createdAt, msg.createdAt)
      const isContinuation = !isFirstOfDay && !!prev && isSameAuthorAndClose(prev, msg)
      return { msg, isFirstOfDay, isContinuation }
    })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-400">
        <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center">
          <svg className="w-7 h-7 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm font-medium">Aucun message pour le moment</p>
        <p className="text-xs text-zinc-500">Soyez le premier a ecrire quelque chose</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-2" style={{ fontFamily: "'Lato', 'Slack-Lato', system-ui, sans-serif" }}>
      {enriched.map(({ msg, isFirstOfDay, isContinuation }) => {
        const member = msg.senderId ? membersById.get(msg.senderId) : undefined
        const author = msg.senderUsername ?? member?.username ?? (msg.senderId ? `User ${msg.senderId}` : 'Inconnu')
        const avatar = resolveAvatarImageUrl(msg.senderAvatar ?? member?.avatar, 64)
        const initials = author.slice(0, 2).toUpperCase()
        const time = formatTime(msg.createdAt)

        const hue = author.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360

        return (
          <div key={msg.id}>
            {isFirstOfDay && (
              <div className="flex items-center gap-3 px-5 my-4">
                <div className="flex-1 h-px bg-zinc-600/50" />
                <span className="text-xs font-semibold text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-600/50 bg-zinc-900 whitespace-nowrap">
                  {formatDateLabel(msg.createdAt)}
                </span>
                <div className="flex-1 h-px bg-zinc-600/50" />
              </div>
            )}

            <div
              className="group relative flex items-start gap-0 px-5 hover:bg-white/[0.04] transition-colors duration-75"
              style={{ paddingTop: isContinuation ? '2px' : '8px', paddingBottom: '2px' }}
            >
              {isContinuation ? (
                <div className="w-9 shrink-0 flex items-center justify-end mr-3">
                  <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity leading-none pt-0.5 select-none">
                    {time}
                  </span>
                </div>
              ) : (
                <div className="w-9 h-9 shrink-0 mr-3 mt-0.5">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={author}
                      loading="lazy"
                      decoding="async"
                      className="w-9 h-9 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white select-none"
                      style={{ backgroundColor: `hsl(${hue}, 55%, 38%)` }}
                    >
                      {initials}
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 min-w-0">
                {!isContinuation && (
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-sm font-bold text-zinc-100 hover:underline cursor-pointer leading-tight">{author}</span>
                    <span className="text-[11px] text-zinc-400 leading-none font-normal">{time}</span>
                  </div>
                )}
                <p className="text-sm text-zinc-200 leading-[1.46667] whitespace-pre-wrap break-words">{msg.content}</p>
              </div>

              <div className="absolute right-4 -top-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg px-1 py-0.5 z-10">
                {['\u{1F642}', '\u{1F44D}', '\u{2705}'].map(emoji => (
                  <button
                    key={emoji}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-700 text-sm transition-colors"
                    title={`Reagir avec ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
                <div className="w-px h-4 bg-zinc-700 mx-0.5" />
                <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors" title="Plus d'options">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} className="h-4" />
    </div>
  )
}

export default memo(MessageList)

