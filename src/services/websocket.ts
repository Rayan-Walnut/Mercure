import { useAppStore } from '../store/useAppStore'

const WS_BASE = 'wss://api.astracode.dev/accounts/messaging/ws'

let ws: WebSocket | null = null
let shouldReconnect = true
let reconnectTimer: number | null = null

export function connectWebSocket(cookie: string): void {
  disconnect(false)
  ws = new WebSocket(`${WS_BASE}?cookie=${encodeURIComponent(cookie)}`)

  ws.addEventListener('open', () => {
    subscribeCurrentThread()
  })

  ws.addEventListener('message', (e) => {
    handleMessage(e.data)
  })

  ws.addEventListener('close', () => {
    if (!shouldReconnect) return
    reconnectTimer = window.setTimeout(() => connectWebSocket(cookie), 2500)
  })
}

export function disconnect(manual: boolean): void {
  shouldReconnect = !manual
  if (reconnectTimer) { window.clearTimeout(reconnectTimer); reconnectTimer = null }
  if (ws) { try { ws.close() } catch { /* ignore */ } ws = null }
}

export function subscribeCurrentThread(): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return
  const thread = useAppStore.getState().activeThread
  if (!thread) return

  ws.send(JSON.stringify(
    thread.type === 'channel'
      ? { type: 'subscribe_channel', channelId: thread.id }
      : { type: 'subscribe_dm', dmId: thread.id }
  ))
}

function handleMessage(raw: unknown): void {
  if (typeof raw !== 'string') return
  let data: Record<string, unknown>
  try { data = JSON.parse(raw) } catch { return }

  const type = data.type ?? data.event
  if (type === 'ws_ready' || type === 'subscribed') return
  if (type !== 'message') return

  const payload = (data.message as Record<string, unknown>) ?? data
  const id = Number(payload.id)
  const content = String(payload.content ?? '')
  if (!id || !content) return

  const thread = useAppStore.getState().activeThread
  const channelId = payload.channelId ? Number(payload.channelId) : undefined
  const dmId = payload.dmId ? Number(payload.dmId) : undefined

  const belongs =
    (thread?.type === 'channel' && channelId === thread.id) ||
    (thread?.type === 'dm' && dmId === thread.id)

  if (!belongs) return

  useAppStore.getState().appendMessage({
    id,
    channelId: channelId ?? null,
    dmId: dmId ?? null,
    senderId: payload.senderId ? Number(payload.senderId) : null,
    content,
    createdAt: typeof payload.createdAt === 'string' ? payload.createdAt : undefined,
  })
}