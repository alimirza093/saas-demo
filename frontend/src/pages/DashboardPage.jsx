import { Download, RefreshCw, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { API_BASE, default as api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Countdown from '../components/Countdown'

export default function DashboardPage() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [history, setHistory] = useState([])
  const [plans, setPlans] = useState([])
  const [selectedOs, setSelectedOs] = useState('windows')

  const loadDashboard = async () => {
    try {
      const [dashboardRes, plansRes] = await Promise.all([
        api.get('/customer/dashboard'),
        api.get('/plans'),
      ])
      setSubscription(dashboardRes.data.subscription)
      setHistory(dashboardRes.data.download_history || [])
      setPlans(plansRes.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const handleRenew = async (planId) => {
    try {
      await api.post('/customer/renew', { plan_id: planId })
      loadDashboard()
    } catch (error) {
      console.error('Renew error', error)
    }
  }

  const handleDownload = async () => {
    try {
      const platform = selectedOs === 'ubuntu' ? 'ubuntu' : 'windows'
      const response = await fetch(`${API_BASE}/api/customer/download?platform=${platform}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('saas-demo-token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Subscription is not active.')
      }

      const fileName = platform === 'ubuntu' ? 'RestaurantSoftware.AppImage' : 'RestaurantSoftware-Setup.exe'
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(downloadUrl)
      loadDashboard()
    } catch (error) {
      console.error(error)
      alert(error.message || 'Unable to download software.')
    }
  }

  if (!user) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-slate-300">Please log in to view your dashboard.</div>
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Customer portal</p>
          <h1 className="mt-2 text-4xl font-bold text-white">Welcome, {user.name}</h1>
        </div>
      </div>

      {!subscription ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <p className="text-lg text-slate-200">No active subscription found yet.</p>
          <p className="mt-2 text-slate-400">Visit the product or pricing page to activate your license.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Subscription status</p>
                  <h2 className="mt-2 text-3xl font-bold text-white">{subscription.status}</h2>
                </div>
                <div className={`rounded-full px-3 py-1 text-sm font-medium ${subscription.status === 'active' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                  {subscription.status === 'active' ? 'Active' : 'Expired'}
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Plan</p>
                  <p className="mt-2 text-xl font-semibold text-white">{subscription.plan_name}</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">License key</p>
                  <p className="mt-2 text-lg font-mono text-violet-300">{subscription.license_key}</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Activation</p>
                  <p className="mt-2 text-sm text-slate-100">{subscription.started_at ? new Date(subscription.started_at).toLocaleString() : 'N/A'}</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Expiry</p>
                  <p className="mt-2 text-sm text-slate-100">{subscription.expires_at ? new Date(subscription.expires_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-violet-100">
                <p className="text-xs uppercase tracking-[0.2em] text-violet-200">Remaining time</p>
                <div className="mt-2 flex items-center gap-3 text-2xl font-semibold text-white">
                  <Countdown remainingSeconds={subscription.remaining_seconds || 0} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
              <h3 className="text-xl font-semibold text-white">Access control</h3>
              <div className="mt-6 space-y-4">
                {subscription.status === 'active' ? (
                  <>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Which operating system do you want to download the software for?</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {['windows', 'ubuntu'].map((os) => (
                        <button
                          key={os}
                          type="button"
                          onClick={() => setSelectedOs(os)}
                          className={`rounded-2xl border p-4 text-left transition ${selectedOs === os ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 bg-slate-950/60 hover:border-slate-500'}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-lg font-semibold text-white">{os === 'windows' ? 'Windows' : 'Ubuntu Linux'}</span>
                            <span>{os === 'windows' ? '🪟' : '🐧'}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button onClick={handleDownload} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400">
                      <Download size={18} />
                      Download {selectedOs === 'windows' ? 'Windows installer' : 'Ubuntu installer'}
                    </button>
                  </>
                ) : (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={18} />
                      Subscription expired. Renew to regain access.
                    </div>
                  </div>
                )}

                {subscription.status !== 'active' && (
                  <div className="space-y-3">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => handleRenew(plan.id)}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-left text-slate-200 hover:border-violet-500"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span>{plan.name}</span>
                          <span className="text-violet-300">Rs. {Number(plan.price).toLocaleString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
            <h3 className="text-2xl font-semibold text-white">Download history</h3>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-700">
              <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-200">
                <thead className="bg-slate-950/80 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="px-4 py-6 text-center text-slate-400">No downloads yet.</td>
                    </tr>
                  ) : (
                    history.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{item.file_name}</div>
                          <div className="text-xs uppercase tracking-[0.15em] text-violet-200">{item.operating_system || 'windows'}</div>
                        </td>
                        <td className="px-4 py-3">{new Date(item.downloaded_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
