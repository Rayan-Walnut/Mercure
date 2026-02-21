import { create } from 'zustand'
import { resolveAvatarUrl } from '../utils/avatar'

const KEYS = {
  accessToken: 'mercure.session.access_token',
  refreshToken: 'mercure.session.refresh_token',
  user: 'mercure.session.user',
  legacyCookie: 'mercure.session.cookie',
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
  accessToken: string
  refreshToken: string
  user: SessionUser | null
  setSession: (accessToken: string, refreshToken: string, user: SessionUser) => void
  setTokens: (accessToken: string, refreshToken: string) => void
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
  accessToken: localStorage.getItem(KEYS.accessToken) ?? localStorage.getItem(KEYS.legacyCookie) ?? '',
  refreshToken: localStorage.getItem(KEYS.refreshToken) ?? '',
  user: loadUserFromStorage(),

  setSession: (accessToken, refreshToken, user) => {
    const normalizedUser = normalizeSessionUser(user) as SessionUser
    localStorage.setItem(KEYS.accessToken, accessToken)
    localStorage.setItem(KEYS.refreshToken, refreshToken)
    localStorage.setItem(KEYS.user, JSON.stringify(normalizedUser))
    set({ accessToken, refreshToken, user: normalizedUser })
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(KEYS.accessToken, accessToken)
    localStorage.setItem(KEYS.refreshToken, refreshToken)
    set({ accessToken, refreshToken })
  },

  clearSession: () => {
    localStorage.removeItem(KEYS.accessToken)
    localStorage.removeItem(KEYS.refreshToken)
    localStorage.removeItem(KEYS.legacyCookie)
    localStorage.removeItem(KEYS.user)
    set({ accessToken: '', refreshToken: '', user: null })
  },
}))
