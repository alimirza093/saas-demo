import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function PricingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)

  useEffect(() => {
    const loadPlans = async () => {
      const { data } = await api.get('/plans')
      setPlans(data)
      setSelectedPlan(data[0]?.id || null)
    }

    loadPlans().catch((err) => console.error(err))
  }, [])

  const activatePurchase = async (planId) => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      const productRes = await api.get('/products')
      const product = productRes.data[0]
      await api.post('/customer/purchase', { product_id: product.id, plan_id: planId })
      navigate('/dashboard')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Simple pricing</p>
        <h1 className="mt-3 text-4xl font-bold text-white">Flexible subscriptions for every stage</h1>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-3xl border p-6 shadow-lg shadow-slate-950/40 ${selectedPlan === plan.id ? 'border-violet-500 bg-violet-500/10' : 'border-slate-800 bg-slate-900/80'}`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Plan</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{plan.name}</h2>
              </div>
              {selectedPlan === plan.id && <div className="rounded-full bg-violet-500 px-3 py-1 text-xs font-medium text-white">Selected</div>}
            </div>

            <div className="mt-6">
              <span className="text-4xl font-bold text-white">Rs. {Number(plan.price).toLocaleString()}</span>
              <span className="ml-2 text-slate-400">/ month</span>
            </div>

            <p className="mt-4 text-slate-300">{plan.description}</p>

            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              <li className="flex items-center gap-2"><Check size={16} className="text-violet-300" /> 5-minute demo subscription activation</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-violet-300" /> Secure license generation</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-violet-300" /> Download access while active</li>
            </ul>

            <button
              type="button"
              onClick={() => {
                setSelectedPlan(plan.id)
                activatePurchase(plan.id)
              }}
              className="mt-8 w-full rounded-full bg-violet-500 px-5 py-3 font-medium text-white transition hover:bg-violet-400"
            >
              Choose {plan.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
