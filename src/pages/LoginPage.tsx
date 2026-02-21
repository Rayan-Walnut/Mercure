import { useState } from 'react'
import { login, getAccountInfo } from '../api/auth'
import { useSessionStore } from '../store/useSessionStore'
import { resolveAvatarUrl } from '../utils/avatar'

export default function LoginPage() {
  const setSession = useSessionStore(s => s.setSession)
  const [email, setEmail] = useState(localStorage.getItem('mercure.login.email') ?? '')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(!!localStorage.getItem('mercure.login.email'))
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return setStatus('Renseigne ton email et ton mot de passe.')

    setLoading(true)
    setStatus('Connexion en cours...')

    try {
      const data = await login(email, password)
      const accessToken = String(data.access_token ?? data.accessToken ?? '')
      const refreshToken = String(data.refresh_token ?? data.refreshToken ?? '')
      if (!accessToken || !refreshToken) throw new Error('Tokens manquants dans la reponse.')

      if (remember) localStorage.setItem('mercure.login.email', email)
      else localStorage.removeItem('mercure.login.email')

      setSession(accessToken, refreshToken, {
        email,
      })

      const accountInfo = await getAccountInfo() as any
      setSession(accessToken, refreshToken, {
        email: accountInfo.email ?? email,
        nom: accountInfo.nom,
        prenom: accountInfo.prenom,
        avatar: resolveAvatarUrl(accountInfo.avatar) ?? undefined,
        handle: accountInfo.handle,
        username: accountInfo.handle,
      })
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Connexion impossible.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-[#0D0D0D] text-zinc-100 flex items-center justify-center p-8">
      <div className="w-full max-w-md">

        <div className="mb-8 space-y-3">
          <img src="/logo.jpg" alt="Mercure" className="h-12 w-12 rounded-lg object-cover" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Mercure</p>
            <h1 className="mt-1 text-3xl font-bold">Connexion</h1>
            <p className="mt-1 text-sm text-zinc-400">Connecte-toi avec ton compte AstraCode.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="exemple@astracode.dev"
              disabled={loading}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none transition"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className="h-4 w-4 rounded accent-indigo-500"
            />
            Retenir mon email
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {status && (
          <p className="mt-4 text-sm text-red-400">{status}</p>
        )}
      </div>
    </div>
  )
}
