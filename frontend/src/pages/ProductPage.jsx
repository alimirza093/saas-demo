import { Download, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function ProductPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productRes, plansRes] = await Promise.all([api.get('/products'), api.get('/plans')])
        setProduct(productRes.data[0])
        setPlans(plansRes.data)
        setSelectedPlan(plansRes.data[0]?.id || null)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!selectedPlan) {
      setMessage('Please select a plan to continue.')
      return
    }

    try {
      const { data } = await api.post('/customer/purchase', {
        product_id: product.id,
        plan_id: selectedPlan,
      })
      setMessage(data.message)
      navigate('/dashboard')
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Unable to purchase this plan.')
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-slate-300">Loading product information...</div>
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-200">
            <Sparkles size={14} />
            Demo desktop application
          </div>
          <h1 className="text-4xl font-bold text-white">{product?.name}</h1>
          <p className="mt-6 text-slate-300">{product?.description}</p>

          <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-300">
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">Version: {product?.version}</div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">Price: Rs. {Number(product?.price || 0).toLocaleString()}/month</div>
          </div>

          <div className="mt-8 space-y-5">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-200">
              <ShieldCheck size={18} />
              Secure license activation from backend with 5-minute demo validity
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-slate-200">
              <Download size={18} className="text-violet-300" />
              Download the demo installer after activation and before expiration
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <h2 className="text-2xl font-semibold text-white">Choose a subscription</h2>
          <div className="mt-6 space-y-4">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${selectedPlan === plan.id ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 bg-slate-950/50 hover:border-slate-500'}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">{plan.name}</p>
                    <p className="mt-1 text-sm text-slate-300">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">Rs. {Number(plan.price).toLocaleString()}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">/month</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handlePurchase}
            className="mt-8 w-full rounded-full bg-violet-500 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-400"
          >
            Buy Now
          </button>

          {message && <p className="mt-4 text-sm text-violet-200">{message}</p>}
        </div>
      </div>
    </div>
  )
}
