import { useState, useEffect } from 'react'
import api from '../api'

const featureLabels = {
  max_products: { label: 'Products', suffix: ' max' },
  max_images_per_product: { label: 'Images per product', suffix: '' },
  discounts_allowed: { label: 'Discount campaigns', suffix: '', type: 'bool' },
  analytics_available: { label: 'Sales analytics', suffix: '', type: 'bool' },
}

export default function VendorPremium() {
  const [plans, setPlans] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(null)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [plansRes, subRes] = await Promise.all([
        api.get('/shop/premium/plans/'),
        api.get('/shop/premium/subscription/').catch(() => ({ data: null })),
      ])
      setPlans(plansRes.data.results || plansRes.data)
      setSubscription(subRes.data)
    } catch {
      setError('Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubscribe = async (planSlug) => {
    setSubscribing(planSlug)
    setError('')
    try {
      await api.post('/shop/premium/subscribe/', { plan_slug: planSlug })
      window.location.reload()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to subscribe')
      setSubscribing(null)
    }
  }

  const handleCancel = async () => {
    setSubscribing('cancel')
    setError('')
    try {
      await api.post('/shop/premium/cancel/')
      window.location.reload()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel')
      setSubscribing(null)
    }
  }

  const currentPlanSlug = subscription?.plan_slug

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex justify-center">
          <svg className="w-8 h-8 text-nike-red animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10 animate-slideUp">
        <p className="text-nike-red text-xs font-bold tracking-[0.25em] uppercase mb-2">Pricing</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>Choose Your Plan</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--theme-text-secondary)' }}>Pick the plan that fits your business. Upgrade anytime.</p>
      </div>

      {/* Current subscription status */}
      {subscription && !subscription.plan_is_free && (
        <div className="mb-8 p-4 rounded-xl liquid-glass-card animate-slideUp" style={{ border: '1px solid var(--theme-border)' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>Current Plan</p>
              <p className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
                {subscription.plan_name}
                {subscription.is_trialing && (
                  <span className="ml-2 text-xs bg-nike-red/10 text-nike-red font-bold px-2 py-0.5 rounded-full">Trial</span>
                )}
              </p>
              {subscription.is_trialing && subscription.trial_end && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                  Trial ends {new Date(subscription.trial_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={handleCancel}
              disabled={subscribing === 'cancel'}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-nike-red/30 text-nike-red hover:bg-nike-red/10 transition-all disabled:opacity-50"
            >
              {subscribing === 'cancel' ? 'Processing...' : 'Downgrade to Free'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-nike-red/10 border border-nike-red/20 text-nike-red text-sm px-4 py-3 rounded-xl animate-slideUp">
          {error}
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => {
          const isCurrent = currentPlanSlug === plan.slug
          const isFree = plan.is_free

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 md:p-8 transition-all duration-500 animate-slideUp ${
                isCurrent
                  ? 'ring-2 ring-nike-red shadow-lg shadow-nike-red/10'
                  : 'hover:scale-[1.02]'
              } liquid-glass-card`}
              style={{
                border: isCurrent ? '1px solid rgba(229,16,29,0.3)' : '1px solid var(--theme-border)',
                animationDelay: `${i * 0.08}s`,
              }}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-nike-red text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                  Current Plan
                </div>
              )}

              {isFree && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-700 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                  Free
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-black" style={{ color: 'var(--theme-text)' }}>
                    {plan.price === '0.00' ? 'Free' : `$${parseFloat(plan.price).toFixed(0)}`}
                  </span>
                  {plan.interval && (
                    <span className="text-sm ml-1" style={{ color: 'var(--theme-text-secondary)' }}>/{plan.interval}</span>
                  )}
                </div>
                <p className="text-xs mt-3" style={{ color: 'var(--theme-text-secondary)' }}>{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                  <svg className={`w-4 h-4 shrink-0 ${plan.max_products >= 50 ? 'text-green-500' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Up to {plan.max_products >= 9999 ? 'unlimited' : plan.max_products} products
                </li>
                <li className="flex items-center gap-3 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                  <svg className={`w-4 h-4 shrink-0 ${plan.max_images_per_product >= 6 ? 'text-green-500' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {plan.max_images_per_product} images per product
                </li>
                <li className="flex items-center gap-3 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                  <svg className={`w-4 h-4 shrink-0 ${plan.discounts_allowed ? 'text-green-500' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {plan.discounts_allowed ? 'Discount campaigns' : 'No discounts'}
                </li>
                <li className="flex items-center gap-3 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                  <svg className={`w-4 h-4 shrink-0 ${plan.analytics_available ? 'text-green-500' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {plan.analytics_available ? 'Sales analytics dashboard' : 'Basic dashboard'}
                </li>
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <div className="text-center text-xs font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
                  {subscription?.is_trialing ? 'Trial in progress' : 'Active plan'}
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.slug)}
                  disabled={subscribing === plan.slug}
                  className={`w-full py-3 rounded-xl text-sm font-bold tracking-wider transition-all duration-300 disabled:opacity-50 ${
                    isFree
                      ? 'border border-zinc-600 text-[var(--theme-text)] hover:bg-zinc-800/50'
                      : 'bg-nike-red text-white hover:bg-white hover:text-nike-black shadow-lg shadow-nike-red/20'
                  }`}
                >
                  {subscribing === plan.slug ? 'Processing...' : isFree ? 'Stay Free' : `Start ${plan.name} Trial`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
