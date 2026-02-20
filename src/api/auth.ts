import { API_BASE, post } from './client'

const p = <T>(path: string, body: Record<string, unknown>) =>
  post<T>(API_BASE, `/accounts${path}`, body)

type User = {
  id?: number
  nom?: string
  prenom?: string
  email?: string
  username?: string
}

type LoginResponse = { cookie: string; user_info?: User }

export const login = (email: string, password: string) =>
  p<LoginResponse>('/login', { email, password })

export const getAccountInfo = (cookie: string) =>
  p<User>('/account-info', { cookie })

export const checkSession = (cookie: string) =>
  p<{ valid: boolean }>('/check', { cookie })