const IS_DEV = import.meta.env.DEV

export const API_BASE = IS_DEV ? '/api' : 'https://api.astracode.dev'
export const MESSAGING_BASE = `${API_BASE}/accounts/messaging`
export const PROFILE_BASE = IS_DEV ? '/profile-api' : 'https://astracode.dev/api'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    return data?.message ?? data?.detail ?? `Erreur HTTP ${res.status}`
  } catch {
    return `Erreur HTTP ${res.status}`
  }
}

export async function post<T>(baseUrl: string, path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new ApiError(res.status, await parseError(res))
  return res.json()
}

let refreshPromise: Promise<string | null> | null = null

async function tryRefreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const { useSessionStore } = await import('../store/useSessionStore')
    const { refreshToken, setTokens, clearSession } = useSessionStore.getState()

    if (!refreshToken) {
      clearSession()
      return null
    }

    try {
      const data = await post<any>(API_BASE, '/accounts/refresh', { refresh_token: refreshToken })
      const nextAccessToken = String(data?.access_token ?? data?.accessToken ?? '')
      const nextRefreshToken = String(data?.refresh_token ?? data?.refreshToken ?? refreshToken)

      if (!nextAccessToken) {
        clearSession()
        return null
      }

      setTokens(nextAccessToken, nextRefreshToken)
      return nextAccessToken
    } catch {
      clearSession()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function fetchWithAuth(
  baseUrl: string,
  path: string,
  init: RequestInit,
  retryOn401 = true,
): Promise<Response> {
  const { useSessionStore } = await import('../store/useSessionStore')
  const token = useSessionStore.getState().accessToken

  const headers = new Headers(init.headers ?? {})
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  })

  if (res.status === 401 && retryOn401) {
    const nextToken = await tryRefreshAccessToken()
    if (!nextToken) return res

    const retryHeaders = new Headers(init.headers ?? {})
    retryHeaders.set('Authorization', `Bearer ${nextToken}`)

    return fetch(`${baseUrl}${path}`, {
      ...init,
      headers: retryHeaders,
    })
  }

  return res
}

export async function postAuth<T>(baseUrl: string, path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetchWithAuth(baseUrl, path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new ApiError(res.status, await parseError(res))
  return res.json()
}
