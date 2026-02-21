import { create } from 'zustand'
import { resolveAvatarUrl } from '../utils/avatar'

const KEYS = {
  cookie: 'mercure.session.cookie',
  user: 'mercure.session.user',
}

type SessionUser = {
  id?: number
  nom?: string
  prenom?: string
  email?: string
  username?: string
  avatar?: string
  handle?: string
}

type SessionStore = {
  cookie: string
  user: SessionUser | null
  setSession: (cookie: string, user: SessionUser) => void
  clearSession: () => void
}

function normalizeSessionUser(user: SessionUser | null): SessionUser | null {
  if (!user) return null
  return {
    ...user,
    avatar: resolveAvatarUrl(user.avatar) ?? undefined,
  }
}

function loadUserFromStorage(): SessionUser | null {
  try {
    const raw = localStorage.getItem(KEYS.user)
    if (!raw) return null
    return normalizeSessionUser(JSON.parse(raw))
  } catch {
    return null
  }
}

export const useSessionStore = create<SessionStore>((set) => ({
  cookie: localStorage.getItem(KEYS.cookie) ?? '',
  user: loadUserFromStorage(),

  setSession: (cookie, user) => {
    const normalizedUser = normalizeSessionUser(user) as SessionUser
    localStorage.setItem(KEYS.cookie, cookie)
    localStorage.setItem(KEYS.user, JSON.stringify(normalizedUser))
    set({ cookie, user: normalizedUser })
  },

  clearSession: () => {
    localStorage.removeItem(KEYS.cookie)
    localStorage.removeItem(KEYS.user)
    set({ cookie: '', user: null })
  },
}))
