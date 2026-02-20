const IS_DEV = import.meta.env.DEV

export const API_BASE = IS_DEV ? '/api' : 'https://api.astracode.dev'
export const MESSAGING_BASE = `${API_BASE}/accounts/messaging`

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