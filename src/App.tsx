import { useSessionStore } from './store/useSessionStore'
import LoginPage from './pages/LoginPage'
import AppPage from './pages/AppPage'

export default function App() {
  const cookie = useSessionStore(s => s.cookie)
  return cookie ? <AppPage /> : <LoginPage />
}