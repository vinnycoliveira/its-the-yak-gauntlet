import { useState, useEffect } from 'react'
import AdminLogin from './AdminLogin'
import AdminAddRunForm from './AdminAddRunForm'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if already authenticated this session
    const auth = sessionStorage.getItem('yakAdminAuth')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (password) => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem('yakAdminAuth', 'true')
      return true
    }
    return false
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('yakAdminAuth')
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-yak-navy">
      <header className="bg-yak-navy-light border-b border-yak-gold/20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yak-gold">Yak Gauntlet Admin</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <AdminAddRunForm />
      </main>
    </div>
  )
}
