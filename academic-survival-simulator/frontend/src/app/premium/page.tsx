'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

export default function PremiumPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to Essay Mode where all features are open access
    const timeout = setTimeout(() => {
      router.replace('/essay-mode')
    }, 1500)
    return () => clearTimeout(timeout)
  }, [router])

  return (
    <main className="min-h-screen bg-[#070712] text-zinc-100 font-mono flex items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-4 rounded-3xl border border-emerald-500/30 bg-[#0d0c1d] p-8 shadow-2xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 mx-auto">
          <Sparkles className="h-8 w-8 animate-pulse" />
        </div>
        <h1 className="text-xl font-black uppercase text-white tracking-wider">
          ALL FEATURES ARE FREE & OPEN ACCESS!
        </h1>
        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
          There are no subscription paywalls or Razorpay locks. You have full access to Essay Mode, AI analysis, and daily quizzes.
        </p>
        <div className="text-[11px] text-emerald-400 font-bold">
          Redirecting you to Essay Mode...
        </div>
      </div>
    </main>
  )
}
