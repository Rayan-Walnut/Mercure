const ASTRACODE_ORIGIN = 'https://astracode.dev'

export function resolveAvatarUrl(value?: string | null): string | null {
  if (!value) return null
  const raw = value.trim()
  if (!raw) return null
  // Avoid returning direct URLs to the uploads host — prefer no-avatar
  // to prevent additional external requests (these avatars are now
  // provided in the user info payload and we don't need to hit the
  // uploads CDN directly).
  if (/upload\.astracode\.dev/i.test(raw)) return null
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('//')) return `https:${raw}`
  if (raw.startsWith('/')) return `${ASTRACODE_ORIGIN}${raw}`
  return `${ASTRACODE_ORIGIN}/${raw}`
}

export function resolveAvatarImageUrl(value?: string | null, size = 64): string | null {
  const resolved = resolveAvatarUrl(value)
  if (!resolved) return null

  try {
    const url = new URL(resolved)
    if (/\.svg$/i.test(url.pathname)) return resolved
    if (!url.searchParams.has('w')) url.searchParams.set('w', String(size))
    if (!url.searchParams.has('h')) url.searchParams.set('h', String(size))
    if (!url.searchParams.has('fit')) url.searchParams.set('fit', 'cover')
    if (!url.searchParams.has('q')) url.searchParams.set('q', '75')
    return url.toString()
  } catch {
    return resolved
  }
}
