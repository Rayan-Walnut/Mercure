import { API_BASE, post, postAuth } from './client'

const p = <T>(path: string, body: Record<string, unknown>) =>
  post<T>(API_BASE, `/accounts${path}`, body)

const pAuth = <T>(path: string, body: Record<string, unknown>) =>
  postAuth<T>(API_BASE, `/accounts${path}`, body)

type User = {
  id?: number
  nom?: string
  prenom?: string
  email?: string
  username?: string
  avatar?: string
  handle?: string
}

type LoginResponse = {
  access_token?: string
  refresh_token?: string
  accessToken?: string
  refreshToken?: string
  user_info?: User
}

export const login = (email: string, password: string) =>
  p<LoginResponse>('/login', { email, password })

export const getAccountInfo = () =>
  pAuth<User>('/account-info', {})

export const usersInfo = (emails: string[]) =>
  pAuth<{ email: string; nom?: string; prenom?: string; avatar?: string | null }[]>(
    '/users-info',
    { emails },
  )

export const checkSession = () =>
  pAuth<{ valid: boolean }>('/check', {})
