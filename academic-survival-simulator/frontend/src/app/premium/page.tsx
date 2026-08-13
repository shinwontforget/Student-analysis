'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Crown, Sparkles, CheckCircle2, Lock, Eye, Zap, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PremiumUpsellCard from '@/components/PremiumUpsellCard'

export default function PremiumPage() {
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<{ id: string; cgpa: number; is_premium: boolean } | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, cgpa, is_premium')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserProfile({
            id: profile.id,
            cgpa: Number(profile.cgpa) || 7.1,
            is_premium: profile.is_premium || false,
          })
        }
      }
    }
    loadUser()
  }, [])

  return (
    <main className="min-h-screen bg-[#070712] text-zinc-100 font-mono select-none p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-10">
        {/* Top Header */}
        <div className="text-center space-y-3 pt-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/40 px-4 py-1.5 text-xs font-bold text-amber-300 shadow-inner">
            <Crown className="h-4 w-4" />
            <span className="uppercase tracking-widest">PREMIUM SCHOLAR PASS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            UNLOCK EVERYTHING.{' '}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              NO CGPA BARRIER.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
            Bypass the 7.50 CGPA requirement for Essay Mode, get unlimited Gemini AI evaluations, and supercharge your academic rank.
          </p>
        </div>

        {/* Subscription Pricing Cards (Yearly ₹99 featured in center) */}
        <PremiumUpsellCard
          cgpa={userProfile?.cgpa ?? 7.1}
          userId={userProfile?.id ?? ''}
          onSubscriptionSuccess={() => {
            if (userProfile) setUserProfile({ ...userProfile, is_premium: true })
          }}
        />

        {/* DEMO SECTION: Preview of Essay Mode with AI evaluation */}
        <div className="rounded-3xl border border-white/10 bg-[#0d0c1d] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> LIVE DEMO PREVIEW
              </span>
              <h3 className="text-lg font-black uppercase text-white mt-1">
                ESSAY MODE & GEMINI EVALUATION ENGINE
              </h3>
            </div>
            <span className="rounded-xl border border-violet-500/30 bg-violet-950/50 px-3 py-1 text-xs font-bold text-violet-300">
              SAMPLE SUBMISSION
            </span>
          </div>

          {/* Sample Challenge */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-zinc-500 uppercase">PROMPT: SOFTWARE ARCHITECTURE</div>
            <h4 className="text-sm font-extrabold text-white font-sans">
              Monolithic vs. Microservices Trade-offs for High-Concurrency Applications
            </h4>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              "Monolithic architectures offer simplicity and low IPC overhead in early stages, but suffer from single-point-of-failure risks and deployment bottlenecks. Microservices decouple domain contexts via API gateways, but introduce network latency and distributed data consistency challenges (CAP theorem)."
            </p>
          </div>

          {/* Demonstration Result Box — Blurred for non-premium */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 space-y-4">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                GEMINI AI ADVANCED SCORE
              </span>
              <div className="text-xl font-black text-white">
                187<span className="text-xs text-zinc-400">/200 PTS</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="text-zinc-400">Writing Quality:</span>{' '}
                <strong className="text-amber-300">94/100</strong>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="text-zinc-400">Originality & Uniqueness:</span>{' '}
                <strong className="text-amber-300">93/100</strong>
              </div>
            </div>

            <div className="text-xs text-zinc-300 font-sans leading-relaxed border-t border-white/10 pt-3">
              "Exceptional critical depth! Clear articulation of CAP theorem trade-offs and distributed transaction complexity (Saga pattern vs 2PC)."
            </div>

            {/* Non-premium blur overlay if not premium */}
            {!userProfile?.is_premium && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-3">
                <Lock className="h-8 w-8 text-amber-400" />
                <div className="text-sm font-black uppercase text-white tracking-wider">
                  PREMIUM EXCLUSIVE AI ANALYSIS
                </div>
                <p className="text-xs text-zinc-300 max-w-sm font-sans">
                  Get full line-by-line Gemini critique, uniqueness breakdown, and instant leaderboard rank boosts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
