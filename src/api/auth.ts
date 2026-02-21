import { API_BASE, post } from './client'

const p = <T>(path: string, body: Record<string, unknown>) =>
  post<T>(API_BASE, `/accounts${path}`, body)

type User = {
  id?: number
  nom?: string
  prenom?: string
  email?: string
  username?: string
  avatar?: string
  handle?: string
}

type LoginResponse = { cookie: string; user_info?: User }

export const login = (email: string, password: string) =>
  p<LoginResponse>('/login', { email, password })

export const getAccountInfo = (cookie: string) =>
  p<User>('/account-info', { cookie })

export const usersInfo = (cookie: string, emails: string[]) =>
  p<{ email: string; nom?: string; prenom?: string; avatar?: string | null }[]>(
    '/users-info',
    { cookie, emails },
  )

export const checkSession = (cookie: string) =>
  p<{ valid: boolean }>('/check', { cookie })