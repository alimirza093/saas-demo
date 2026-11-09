import { useEffect, useState } from 'react'
import api from '../services/api'

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState({})
  const [customers, setCustomers] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [plans, setPlans] = useState([])

  const loadData = async () => {
    try {
      const [overviewRes, customersRes, subscriptionsRes, plansRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/customers'),
        api.get('/admin/subscriptions'),
        api.get('/plans'),
      ])
      setOverview(overviewRes.data)
      setCustomers(customersRes.data)
      setSubscriptions(subscriptionsRes.data)
      setPlans(plansRes.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRenew = async (subscriptionId, planId) => {
    await api.post(`/admin/subscriptions/${subscriptionId}/renew`, { plan_id: planId })
    loadData()
  }

  const handlePlanChange = async (subscriptionId, planId) => {
    await api.post(`/admin/subscriptions/${subscriptionId}/change-plan`, { plan_id: planId })
    loadData()
  }

  const handleToggle = async (subscriptionId) => {
    await api.post(`/admin/subscriptions/${subscriptionId}/toggle`)
    loadData()
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Super admin</p>
        <h1 className="mt-2 text-4xl font-bold text-white">Admin dashboard</h1>
      </div>

      <div className="mb-10 grid gap-4 md:grid-cols-5">
        {[
          { label: 'Customers', value: overview.total_customers || 0 },
          { label: 'Active', value: overview.active_subscriptions || 0 },
          { label: 'Expired', value: overview.expired_subscriptions || 0 },
          { label: 'Downloads', value: overview.total_downloads || 0 },
          { label: 'Recent', value: overview.recent_purchases?.length || 0 },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="mb-4 text-2xl font-semibold text-white">Customers</h2>
          <div className="space-y-3">
            {customers.map((customer) => (
              <div key={customer.id} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{customer.name}</p>
                    <p className="text-sm text-slate-400">{customer.email}</p>
                  </div>
                  <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">{customer.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="mb-4 text-2xl font-semibold text-white">Recent purchases</h2>
          <div className="space-y-3">
            {(overview.recent_purchases || []).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-white">{item.customer}</p>
                  <span className="rounded-full bg-violet-500/10 px-2 py-1 text-xs text-violet-200">{item.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.plan}</p>
                <p className="mt-1 text-xs text-slate-400">{item.expires_at ? new Date(item.expires_at).toLocaleString() : 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h2 className="mb-4 text-2xl font-semibold text-white">Subscriptions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-200">
            <thead className="bg-slate-950/80 text-slate-400">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">License</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {subscriptions.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-white">{row.customer}</td>
                  <td className="px-4 py-3">{row.plan}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3 font-mono text-violet-300">{row.license_key}</td>
                  <td className="px-4 py-3">{row.expires_at ? new Date(row.expires_at).toLocaleString() : 'N/A'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <select
                        defaultValue={plans[0]?.id || ''}
                        onChange={(e) => handleRenew(row.id, Number(e.target.value))}
                        className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                      >
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>{plan.name}</option>
                        ))}
                      </select>
                      <button onClick={() => handleToggle(row.id)} className="rounded border border-slate-700 px-2 py-1 text-xs text-white">Toggle</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
