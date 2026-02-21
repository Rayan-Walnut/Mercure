import { create } from 'zustand'

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

export const useSessionStore = create<SessionStore>((set) => ({
  cookie: localStorage.getItem(KEYS.cookie) ?? '',
  user: JSON.parse(localStorage.getItem(KEYS.user) ?? 'null'),

  setSession: (cookie, user) => {
    localStorage.setItem(KEYS.cookie, cookie)
    localStorage.setItem(KEYS.user, JSON.stringify(user))
    set({ cookie, user })
  },

  clearSession: () => {
    localStorage.removeItem(KEYS.cookie)
    localStorage.removeItem(KEYS.user)
    set({ cookie: '', user: null })
  },
}))
