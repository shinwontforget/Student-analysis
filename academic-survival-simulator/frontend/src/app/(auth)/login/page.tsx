'use client'

import React, { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Terminal, Zap } from 'lucide-react'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      // Check if user has logged their habits before (returning user vs first-time user)
      if (authData.user) {
        const { count } = await supabase
          .from('daily_habit_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', authData.user.id)

        if (!count || count === 0) {
          // First-time user: redirect to habit onboarding to choose study, sleep, coffee, gaming & get predicted CGPA
          router.refresh()
          router.push('/onboarding')
          return
        }
      }

      router.refresh()
      router.push(next)
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#070712] text-zinc-100 p-4 font-mono select-none">
      {/* Top Terminal Icon Glow Box */}
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/40 bg-violet-600/10 text-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.25)]">
        <Terminal className="h-7 w-7" />
      </div>

      {/* Main Title Header */}
      <h1 className="text-2xl sm:text-3xl font-black tracking-widest uppercase text-white mb-1 text-center">
        ACADEMIC_SURVIVAL.EXE
      </h1>
      <p className="text-[11px] text-zinc-400 tracking-widest uppercase mb-8 text-center max-w-sm">
        BUILD YOUR SEMESTER. SEE WHAT BREAKS FIRST.
      </p>

      {/* Main Card Container */}
      <div className="w-full max-w-md rounded-3xl border border-violet-500/30 bg-[#0d0c1d]/90 p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        {/* Tab Toggle: LOG IN | START YOUR JOURNEY */}
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#070712] p-1 border border-white/10 text-[10px] font-bold uppercase tracking-wider">
          <button className="rounded-lg bg-[#15132b] py-2.5 text-white shadow-md border border-white/10 font-black">
            LOG IN
          </button>
          <Link
            href="/signup"
            className="rounded-lg py-2.5 text-center text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1"
          >
            <Zap className="h-3 w-3 text-violet-400" /> START YOUR JOURNEY
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-400"
            >
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070712] px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono"
              placeholder="student@campus.edu"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-400"
            >
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070712] px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:bg-violet-500 active:scale-[0.99] disabled:opacity-50 transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> ENTERING SIMULATION...
              </>
            ) : (
              'ENTER SIMULATION'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs font-sans text-zinc-500">
          New challenger?{' '}
          <Link
            href="/signup"
            className="font-mono font-bold text-violet-400 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  )
}
