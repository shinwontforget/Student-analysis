'use client'

import React, { useState, useTransition, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Terminal, Zap } from 'lucide-react'

function LoginForm() {
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-900 p-4 font-mono select-none">
      {/* Top Terminal Icon Box */}
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm">
        <Terminal className="h-7 w-7" />
      </div>

      {/* Main Title Header */}
      <h1 className="text-2xl sm:text-3xl font-black tracking-widest uppercase text-slate-900 mb-1 text-center">
        ACADEMIC_SURVIVAL.EXE
      </h1>
      <p className="text-[11px] text-slate-500 tracking-widest uppercase mb-8 text-center max-w-sm">
        BUILD YOUR SEMESTER. SEE WHAT BREAKS FIRST.
      </p>

      {/* Main Card Container */}
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Tab Toggle: LOG IN | START YOUR JOURNEY */}
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 border border-slate-200 text-[10px] font-bold uppercase tracking-wider">
          <button className="rounded-lg bg-white py-2.5 text-slate-900 shadow-sm border border-slate-200 font-black">
            LOG IN
          </button>
          <Link
            href="/signup"
            className="rounded-lg py-2.5 text-center text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center gap-1"
          >
            <Zap className="h-3 w-3 text-indigo-600" /> START YOUR JOURNEY
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-600"
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
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-mono"
              placeholder="student@campus.edu"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-600"
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
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-mono"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 transition-all"
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

        <p className="mt-6 text-center text-xs font-sans text-slate-500">
          New challenger?{' '}
          <Link
            href="/signup"
            className="font-mono font-bold text-indigo-600 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 font-mono">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
