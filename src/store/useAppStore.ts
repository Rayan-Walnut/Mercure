import { create } from 'zustand'

export type Workspace = {
  id: number
  name: string
  icon?: string | null
  ownerId?: number
  createdAt?: string
}
export type Channel = {
  id: number
  workspaceId: number
  name: string
  isPrivate?: boolean
  category?: string | null
  position?: number
}

export type DM = {
  id: number
  workspaceId: number
  participants: number[]
}

export type Member = {
  id: number
  username: string
  email?: string
  avatar?: string | null
  role?: string
}

export type Message = {
  id: number
  channelId?: number | null
  dmId?: number | null
  senderId?: number | null
  senderAvatar?: string | null
  senderUsername?: string | null
  content: string
  createdAt?: string
}

export type ActiveThread =
  | { type: 'channel'; id: number }
  | { type: 'dm'; id: number }

export type WsEvent = Record<string, unknown>

type AppStore = {
  workspaces: Workspace[]
  channels: Channel[]
  dms: DM[]
  messages: Message[]
  membersById: Map<number, Member>
  activeWorkspaceId: number | null
  activeThread: ActiveThread | null
  currentUserId: number | null
  scopeLoading: boolean

  // ── Présence ──────────────────────────────────────────────────────────────
  onlineUserIds: Set<number>
  lastWsEvent: WsEvent | null

  setWorkspaces: (ws: Workspace[]) => void
  setChannels: (ch: Channel[]) => void
  setDms: (dms: DM[]) => void
  setMembers: (members: Member[], currentUserId: number | null) => void
  setMessages: (msgs: Message[]) => void
  appendMessage: (msg: Message) => void
  setActiveWorkspace: (id: number) => void
  setActiveThread: (thread: ActiveThread | null) => void
  setScopeLoading: (v: boolean) => void

  // ── Présence ──────────────────────────────────────────────────────────────
  setOnlineUserIds: (ids: Set<number> | ((prev: Set<number>) => Set<number>)) => void
  setLastWsEvent: (event: WsEvent) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  workspaces: [],
  channels: [],
  dms: [],
  messages: [],
  membersById: new Map(),
  activeWorkspaceId: null,
  activeThread: null,
  currentUserId: null,
  scopeLoading: false,

  // ── Présence ──────────────────────────────────────────────────────────────
  onlineUserIds: new Set<number>(),
  lastWsEvent: null,

  setWorkspaces: (workspaces) => set({ workspaces }),
  setChannels: (channels) => set({ channels }),
  setDms: (dms) => set({ dms }),
  setMembers: (members, currentUserId) => set({
    membersById: new Map(members.map(m => [m.id, m])),
    currentUserId,
  }),
  setMessages: (messages) => set({ messages: [...messages].sort((a, b) => a.id - b.id) }),
  appendMessage: (msg) => {
    const messages = get().messages
    if (messages.some(m => m.id === msg.id)) return
    set({ messages: [...messages, msg].sort((a, b) => a.id - b.id) })
  },
  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
  setActiveThread: (thread) => set({ activeThread: thread }),
  setScopeLoading: (scopeLoading) => set({ scopeLoading }),

  // ── Présence ──────────────────────────────────────────────────────────────
  setOnlineUserIds: (ids) =>
    set((state) => ({
      onlineUserIds: typeof ids === 'function' ? ids(state.onlineUserIds) : ids,
    })),
  setLastWsEvent: (event) => set({ lastWsEvent: event }),
}))