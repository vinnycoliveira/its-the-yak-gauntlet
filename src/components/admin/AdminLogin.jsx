import { useState } from 'react'

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const success = onLogin(password)
    if (!success) {
      setError('Incorrect password')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-yak-navy flex items-center justify-center px-4">
      <div className="bg-yak-navy-light rounded-xl p-8 w-full max-w-md border border-yak-gold/20">
        <h1 className="text-2xl font-bold text-yak-gold text-center mb-6">
          Yak Gauntlet Admin
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-yak-navy border border-gray-600 rounded-lg text-white focus:border-yak-gold focus:outline-none transition-colors"
              placeholder="Enter admin password"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-yak-gold text-yak-navy font-semibold rounded-lg hover:bg-yak-gold-light transition-colors"
          >
            Login
          </button>
        </form>
        <p className="text-center text-gray-500 text-sm mt-6">
          <a href="/" className="hover:text-yak-gold transition-colors">
            &larr; Back to Leaderboard
          </a>
        </p>
      </div>
    </div>
  )
}
