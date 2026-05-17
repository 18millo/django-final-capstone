import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Reveal from '../components/ui/Reveal'

export default function UsernameSetup() {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUsername: saveUsername } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim()) {
      setError('Username is required')
      return
    }
    setLoading(true)
    try {
      await saveUsername(username)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.username?.[0] || 'Failed to set username'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Reveal direction="up">
      <div className="text-center">
        <div className="w-16 h-16 bg-nike-amber/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">👋</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white mb-2">ALMOST THERE!</h2>
        <p className="text-white/40 text-sm mb-8">Choose a username to complete your account.</p>
        {error && (
          <div className="bg-nike-red/10 border border-nike-red/20 text-nike-red px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter a unique username"
            required
          />
          <Button type="submit" loading={loading} className="w-full">Complete Setup</Button>
        </form>
      </div>
    </Reveal>
  )
}
