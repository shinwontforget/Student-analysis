'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Terminal, Zap } from 'lucide-react'
import { LEVEL_LABELS, FIELD_LABELS, FIELDS_BY_LEVEL, StudentLevel, StudentField } from '@/data/essay-challenges'

export default function SignUpPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [studentLevel, setStudentLevel] = useState<StudentLevel>('college')
  const [studentField, setStudentField] = useState<StudentField>('computer_science')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    startTransition(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            student_level: studentLevel,
            student_field: studentField,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
          setError('An account with this email already exists. Please log in instead!')
        } else {
          setError(error.message)
        }
        return
      }

      // Supabase returns empty identities array if user already exists (when confirmation is on)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('An account with this email already exists. Please log in instead!')
        return
      }

      if (data.session) {
        router.refresh()
        router.push('/dashboard')
      } else {
        setInfo(
          `⚡ ACTIVATION BEACON DISPATCHED! We sent a confirmation link to ${email}. Check your inbox (or spam folder) and click the link to activate your Scholar profile!`
        )
      }
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
        CREATE YOUR SCHOLAR AVATAR & START YOUR RUN.
      </p>

      {/* Main Card Container */}
      <div className="w-full max-w-md rounded-3xl border border-violet-500/30 bg-[#0d0c1d]/90 p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        {/* Tab Toggle: LOG IN | START YOUR JOURNEY */}
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#070712] p-1 border border-white/10 text-[10px] font-bold uppercase tracking-wider">
          <Link
            href="/login"
            className="rounded-lg py-2.5 text-center text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center"
          >
            LOG IN
          </Link>
          <button className="rounded-lg bg-violet-600 py-2.5 text-white shadow-md border border-violet-400/30 font-black flex items-center justify-center gap-1">
            <Zap className="h-3 w-3 fill-current" /> START YOUR JOURNEY
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="full-name"
              className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-400"
            >
              FULL NAME
            </label>
            <input
              id="full-name"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070712] px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono"
              placeholder="Jane Smith"
            />
          </div>

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
              placeholder="you@example.com"
            />
          </div>

          {/* Education Level */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
              EDUCATION LEVEL
            </label>
            <select
              value={studentLevel}
              onChange={(e) => {
                const lvl = e.target.value as StudentLevel
                setStudentLevel(lvl)
                setStudentField(FIELDS_BY_LEVEL[lvl][0])
              }}
              className="w-full rounded-xl border border-white/10 bg-[#070712] px-4 py-3 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
            >
              {(Object.entries(LEVEL_LABELS) as [StudentLevel, string][]).map(([lvl, label]) => (
                <option key={lvl} value={lvl}>{label}</option>
              ))}
            </select>
          </div>

          {/* Subject Field */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
              SUBJECT FIELD
            </label>
            <select
              value={studentField}
              onChange={(e) => setStudentField(e.target.value as StudentField)}
              className="w-full rounded-xl border border-white/10 bg-[#070712] px-4 py-3 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
            >
              {FIELDS_BY_LEVEL[studentLevel].map((f) => (
                <option key={f} value={f}>{FIELD_LABELS[f]}</option>
              ))}
            </select>
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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070712] px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono"
              placeholder="Min. 8 characters"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
              ⚠️ {error}
            </div>
          )}

          {info && (
            <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/30 p-3 text-xs text-indigo-300">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !!info}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:bg-violet-500 active:scale-[0.99] disabled:opacity-50 transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> CREATING ACCOUNT...
              </>
            ) : (
              <><Zap className="h-4 w-4 fill-current" /> START YOUR JOURNEY</>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs font-sans text-zinc-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-mono font-bold text-violet-400 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
