'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ShieldCheck, Loader2, Star } from 'lucide-react'
import { SUBSCRIPTION_PLANS, PlanConfig } from '@/lib/config/plans'

interface PremiumUpsellCardProps {
  cgpa: number
  userId: string
  onSubscriptionSuccess?: () => void
}

// Display order: Monthly | Yearly (center/featured) | Quarterly
const PLAN_DISPLAY_ORDER = ['monthly', 'yearly', 'quarterly']

const PLAN_PERIOD_LABEL: Record<string, string> = {
  monthly:   'PER MONTH',
  quarterly: 'PER 3 MONTHS',
  yearly:    'PER YEAR',
}

const PLAN_FEATURES = [
  'Unlimited essay submissions',
  'Instant unlock',
  'No CGPA requirement',
]

export const PremiumUpsellCard: React.FC<PremiumUpsellCardProps> = ({
  cgpa,
  userId,
  onSubscriptionSuccess,
}) => {
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const orderedPlans = PLAN_DISPLAY_ORDER.map((id) => SUBSCRIPTION_PLANS[id]).filter(Boolean)

  const handleCheckout = async (plan: PlanConfig) => {
    setLoading((prev) => ({ ...prev, [plan.id]: true }))
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const res = await fetch('/api/subscription/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      })

      const orderData = await res.json()
      if (!res.ok || !orderData.success) throw new Error(orderData.error || 'Failed to initialize order')

      const { order_id, key_id, amount, currency } = orderData

      if (typeof window !== 'undefined' && !(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
          document.body.appendChild(script)
        })
      }

      const options = {
        key: key_id, amount, currency,
        name: 'Academic Survival Simulator',
        description: `${plan.name} (${plan.durationDays} Days Access)`,
        order_id,
        handler: async function (response: any) {
          const verifyRes = await fetch('/api/subscription/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              user_id: userId,
              plan_id: plan.id,
            }),
          })
          const verifyData = await verifyRes.json()
          if (verifyRes.ok && verifyData.status === 'success') {
            setSuccessMessage(`🎉 Premium Activated! Essay Mode unlocked for ${plan.durationDays} days.`)
            if (onSubscriptionSuccess) onSubscriptionSuccess()
            setTimeout(() => window.location.reload(), 1800)
          } else {
            setErrorMessage(verifyData.error || 'Payment verification failed.')
          }
        },
        prefill: { name: 'Student User', email: 'student@example.com' },
        theme: { color: '#7c3aed' },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      setErrorMessage(err.message || 'Checkout failed. Please try again.')
    } finally {
      setLoading((prev) => ({ ...prev, [plan.id]: false }))
    }
  }

  return (
    <div className="w-full py-14 px-4">
      {/* Section Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-black tracking-widest uppercase text-white mb-2" style={{ fontFamily: 'monospace' }}>
          UNLOCK UNLIMITED ESSAY MODE
        </h2>
        <p className="text-sm text-zinc-400 tracking-widest">Skip the 7.5 CGPA grind.</p>
        <div className="inline-flex items-center gap-2 mt-3 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="h-3.5 w-3.5" /> Razorpay Test Mode • No real money charged
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="mb-6 mx-auto max-w-2xl rounded-lg bg-rose-500/20 border border-rose-500/40 p-3 text-xs text-rose-300 text-center">⚠️ {errorMessage}</div>
      )}
      {successMessage && (
        <div className="mb-6 mx-auto max-w-2xl rounded-lg bg-emerald-500/20 border border-emerald-500/40 p-3 text-xs text-emerald-300 text-center">{successMessage}</div>
      )}

      {/* Pricing Cards: Monthly | Yearly (FEATURED) | Quarterly */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto items-stretch">
        {orderedPlans.map((plan) => {
          const isFeatured = plan.id === 'yearly'
          const isLoading = !!loading[plan.id]

          return (
            <motion.div
              key={plan.id}
              whileHover={{ scale: 1.02, y: -3 }}
              className={`relative flex flex-col rounded-2xl border p-7 transition-all duration-200 ${
                isFeatured
                  ? 'border-amber-400/70 bg-[#14131f] shadow-[0_0_50px_rgba(245,158,11,0.12)]'
                  : 'border-white/10 bg-[#0e0d1a]'
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 rounded-full bg-amber-400 px-3 py-0.5 text-[11px] font-black text-zinc-950 uppercase tracking-widest shadow">
                    <Star className="h-2.5 w-2.5 fill-current" /> BEST VALUE
                  </span>
                </div>
              )}

              <div className={`text-[11px] font-bold tracking-[0.2em] uppercase mb-4 ${isFeatured ? 'text-amber-300' : 'text-zinc-500'}`}>
                {plan.id === 'monthly' ? 'MONTHLY' : plan.id === 'quarterly' ? 'QUARTERLY' : 'YEARLY'}
              </div>

              <div className="mb-1">
                <span className={`text-5xl font-black ${isFeatured ? 'text-amber-300' : 'text-white'}`} style={{ fontFamily: 'monospace' }}>
                  ₹{plan.amountINR}
                </span>
              </div>
              <div className="text-[10px] font-semibold tracking-widest text-zinc-500 mb-6 uppercase">
                {PLAN_PERIOD_LABEL[plan.id]}
              </div>

              <ul className="space-y-2.5 flex-1 mb-7">
                {PLAN_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-zinc-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={isLoading}
                onClick={() => handleCheckout(plan)}
                className={`w-full rounded-xl py-3 text-[11px] font-black tracking-widest uppercase transition-all disabled:opacity-50 ${
                  isFeatured
                    ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300 shadow-lg shadow-amber-400/20'
                    : 'border border-white/20 text-white hover:bg-white/5'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...
                  </span>
                ) : isFeatured ? (
                  'GO PREMIUM'
                ) : (
                  `CHOOSE ${plan.id === 'monthly' ? 'MONTHLY' : 'QUARTERLY'}`
                )}
              </motion.button>
            </motion.div>
          )
        })}
      </div>

      <p className="text-center text-[11px] text-zinc-600 mt-6">
        One-time payment • No auto-renewing subscription • New purchase stacks on active plan days
      </p>
    </div>
  )
}

export default PremiumUpsellCard

