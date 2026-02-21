import { useSessionStore } from './store/useSessionStore'
import LoginPage from './pages/LoginPage'
import AppPage from './pages/AppPage'

export default function App() {
  const accessToken = useSessionStore(s => s.accessToken)
  return accessToken ? <AppPage /> : <LoginPage />
}
