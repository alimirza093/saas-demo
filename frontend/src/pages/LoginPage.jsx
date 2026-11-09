import { LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to sign in.')
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/30">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-xl bg-violet-500/10 p-3 text-violet-300">
            <LockKeyhole size={18} />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">Login to access your subscription dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Email</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/60 px-3 py-2">
              <Mail size={16} className="text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                placeholder="you@example.com"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Password</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/60 px-3 py-2">
              <LockKeyhole size={16} className="text-slate-400" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                placeholder="••••••••"
                required
              />
            </div>
          </label>

          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

          <button type="submit" className="w-full rounded-full bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400">
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don’t have an account? <Link to="/register" className="text-violet-300">Create one</Link>
        </p>
      </div>
    </div>
  )
}
