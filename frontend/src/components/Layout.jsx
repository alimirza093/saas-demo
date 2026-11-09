import { LogOut, Shield, ShoppingBag, Sparkles, User } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Product', to: '/product' },
  { label: 'Pricing', to: '/pricing' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800/90 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 text-lg font-semibold text-white">
            <div className="rounded-xl bg-violet-500/20 p-2 text-violet-300">
              <Sparkles size={18} />
            </div>
            RestaurantOS
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition ${isActive ? 'text-violet-300' : 'text-slate-300 hover:text-white'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="hidden items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-200 md:flex">
                  {user.role === 'admin' ? <Shield size={16} /> : <User size={16} />}
                  {user.name || user.email}
                </Link>
                <button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:border-violet-500">
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-violet-500 hover:text-white">
                  Login
                </Link>
                <Link to="/register" className="rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-400">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-800 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-violet-300" />
            RestaurantOS © 2026
          </div>
          <div>Demo licensing and SaaS subscription system</div>
        </div>
      </footer>
    </div>
  )
}
