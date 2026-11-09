import { ArrowRight, BarChart3, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  { title: 'Multi-location tracking', icon: BarChart3, description: 'Monitor sales, staffing, and table flow across every restaurant location.' },
  { title: 'Secure cloud licensing', icon: ShieldCheck, description: 'Business-grade license management with backend enforcement and subscription expiry controls.' },
  { title: 'Fast onboarding', icon: Sparkles, description: 'Launch your restaurant operations in days with guided setup and demo onboarding.' },
]

const steps = [
  'Create your account and choose a subscription plan',
  'Activate the demo license and access the desktop software',
  'Manage inventory, staff, payments, and reports with secure access control',
]

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <section className="grid items-center gap-12 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-200">
            <CheckCircle size={14} />
            Trusted by growing hospitality brands
          </div>
          <h1 className="max-w-xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Control your restaurant with smart software and secure licensing.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-slate-300">
            RestaurantOS helps food businesses streamline orders, inventory, reporting, and team productivity in one modern platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/pricing" className="rounded-full bg-violet-500 px-6 py-3 font-medium text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-400">
              Start Free Trial
            </Link>
            <Link to="/product" className="rounded-full border border-slate-700 px-6 py-3 font-medium text-slate-200 transition hover:border-violet-500">
              View Product
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl shadow-slate-950/60">
          <div className="rounded-2xl border border-violet-500/20 bg-slate-950/60 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Live operations</p>
                <h2 className="text-xl font-semibold text-white">RestaurantOS Dashboard</h2>
              </div>
              <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">Online</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Revenue</p>
                <p className="mt-2 text-2xl font-bold text-white">Rs. 2.4L</p>
              </div>
              <div className="rounded-xl bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Orders</p>
                <p className="mt-2 text-2xl font-bold text-white">1,480</p>
              </div>
              <div className="rounded-xl bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Uptime</p>
                <p className="mt-2 text-2xl font-bold text-white">99.9%</p>
              </div>
            </div>

            <div className="mt-6 h-48 rounded-2xl bg-gradient-to-r from-violet-500/20 via-slate-800 to-cyan-500/20 p-4">
              <div className="flex h-full items-end gap-3">
                {[40, 58, 52, 72, 85, 90, 70].map((height, index) => (
                  <div key={index} className="flex-1 rounded-t-xl bg-gradient-to-t from-violet-400 to-cyan-400" style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mb-12 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Why restaurant teams choose us</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Built for fast-moving hospitality teams</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map(({ title, icon: Icon, description }) => (
            <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/30">
              <div className="mb-4 inline-flex rounded-xl bg-violet-500/10 p-3 text-violet-300">
                <Icon size={20} />
              </div>
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-slate-300">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white">How it works</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-violet-500 font-bold text-white">{index + 1}</div>
                <p className="text-lg text-slate-200">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="rounded-3xl border border-violet-500/20 bg-violet-500/10 p-8 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to modernize your operations?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-200">
            Join restaurants using RestaurantOS to improve service quality, reduce waste, and generate faster reporting.
          </p>
          <Link to="/pricing" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-slate-950 transition hover:bg-slate-200">
            Explore plans <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
