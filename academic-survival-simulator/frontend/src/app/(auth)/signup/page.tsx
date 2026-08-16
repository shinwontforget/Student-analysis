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
        CREATE YOUR SCHOLAR AVATAR & START YOUR RUN.
      </p>

      {/* Main Card Container */}
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Tab Toggle: LOG IN | START YOUR JOURNEY */}
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 border border-slate-200 text-[10px] font-bold uppercase tracking-wider">
          <Link
            href="/login"
            className="rounded-lg py-2.5 text-center text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center"
          >
            LOG IN
          </Link>
          <button className="rounded-lg bg-indigo-600 py-2.5 text-white shadow-sm font-black flex items-center justify-center gap-1">
            <Zap className="h-3 w-3 fill-current" /> START YOUR JOURNEY
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="full-name"
              className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-600"
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
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-mono"
              placeholder="Jane Smith"
            />
          </div>

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
              placeholder="you@example.com"
            />
          </div>

          {/* Education Level */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-600">
              EDUCATION LEVEL
            </label>
            <select
              value={studentLevel}
              onChange={(e) => {
                const lvl = e.target.value as StudentLevel
                setStudentLevel(lvl)
                setStudentField(FIELDS_BY_LEVEL[lvl][0])
              }}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-mono"
            >
              {(Object.entries(LEVEL_LABELS) as [StudentLevel, string][]).map(([lvl, label]) => (
                <option key={lvl} value={lvl}>{label}</option>
              ))}
            </select>
          </div>

          {/* Subject Field */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-600">
              SUBJECT FIELD
            </label>
            <select
              value={studentField}
              onChange={(e) => setStudentField(e.target.value as StudentField)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-mono"
            >
              {FIELDS_BY_LEVEL[studentLevel].map((f) => (
                <option key={f} value={f}>{FIELD_LABELS[f]}</option>
              ))}
            </select>
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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-mono"
              placeholder="Min. 8 characters"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              ⚠️ {error}
            </div>
          )}

          {info && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 text-xs text-indigo-700">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !!info}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 transition-all"
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

        <p className="mt-6 text-center text-xs font-sans text-slate-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-mono font-bold text-indigo-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
