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
