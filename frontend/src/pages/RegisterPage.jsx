import { ArrowRight, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      await register(form.name, form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to create user.')
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-xl bg-violet-500/10 p-3 text-violet-300">
            <UserRound size={18} />
          </div>
          <h1 className="text-3xl font-bold text-white">Create account</h1>
          <p className="mt-2 text-sm text-slate-400">Register to activate your software subscription.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Full name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-violet-500"
              placeholder="John Morson"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-violet-500"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-violet-500"
              placeholder="Minimum 6 characters"
              minLength="6"
              required
            />
          </label>

          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400">
            Register <ArrowRight size={18} />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account? <Link to="/login" className="text-violet-300">Login</Link>
        </p>
      </div>
    </div>
  )
}
