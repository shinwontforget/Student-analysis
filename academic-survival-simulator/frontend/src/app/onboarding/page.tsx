'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Moon, Coffee, Gamepad2, BookOpen, Zap, ArrowRight, Brain, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { GamificationEngine } from '@/lib/services/gamificationEngine'
import Logo from '@/components/Logo'
import { toast } from '@/components/Toast'

const SUGGESTED_SCHEDULES = [
  { label: 'Warrior Mode', sleep: 6, study: 8, coffee: 3, gaming: 1, desc: 'Max grind, minimum rest.' },
  { label: 'Balanced Scholar', sleep: 7.5, study: 5, coffee: 2, gaming: 2, desc: 'Sustainable daily routine.' },
  { label: 'Night Owl', sleep: 5, study: 7, coffee: 4, gaming: 3, desc: 'Late night power sessions.' },
  { label: 'Chill Student', sleep: 9, study: 4, coffee: 1, gaming: 4, desc: 'Life-study balance first.' },
]

function RangeSlider({
  icon, label, unit, min, max, step, value, onChange, color
}: {
  icon: React.ReactNode; label: string; unit: string; min: number; max: number;
  step: number; value: number; onChange: (v: number) => void; color: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${color}`}>
          {icon} {label}
        </div>
        <span className="text-sm font-black text-slate-900 font-mono">
          {value}<span className="text-xs text-slate-500 ml-1">{unit}</span>
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-indigo-600 cursor-pointer"
      />
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  const [fullName, setFullName] = useState('')

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const metadataName = user.user_metadata?.full_name || user.user_metadata?.name || ''
        const fallbackName = user.email ? user.email.split('@')[0] : ''
        setFullName(metadataName || fallbackName)
      }
    }
    loadUser()
  }, [])
  const [targetCgpa, setTargetCgpa] = useState(8.0)
  const [sleep, setSleep]   = useState(7.5)
  const [study, setStudy]   = useState(5.0)
  const [coffee, setCoffee] = useState(2)
  const [gaming, setGaming] = useState(2.0)

  const { energy, stress } = GamificationEngine.calculateEnergyStress({ sleep, study, coffee, gaming })

  // Calculate dynamic starting CGPA between 3.00 and 3.50 based on efficiency
  const startingCgpa = parseFloat(
    (
      3.00 +
      Math.min(
        0.50,
        Math.max(
          0.00,
          (energy * 0.003) + (study >= 6 ? 0.15 : 0.05) - (stress > 60 ? 0.10 : 0)
        )
      )
    ).toFixed(2)
  )

  const applyPreset = (p: typeof SUGGESTED_SCHEDULES[0]) => {
    setSleep(p.sleep); setStudy(p.study); setCoffee(p.coffee); setGaming(p.gaming)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Upsert profile row with starting CGPA dynamically set between 3.00 - 3.50
      const { error: profileError } = await supabase.from('users').upsert({
        id: user.id,
        email: user.email ?? '',
        full_name: fullName.trim() || (user.email?.split('@')[0] ?? 'Scholar'),
        cgpa: startingCgpa,
        is_premium: false,
        user_type: 'student',
      })

      if (profileError) {
        toast('Failed to save profile: ' + profileError.message, 'error')
        return
      }

      // Save today's habit log
      await supabase.from('daily_habit_logs').upsert({
        user_id: user.id,
        logged_date: new Date().toISOString().split('T')[0],
        sleep_hrs: sleep,
        study_hrs: study,
        coffee_cups: coffee,
        gaming_hrs: gaming,
        energy,
        stress,
      }, { onConflict: 'user_id,logged_date' })

      toast(`Welcome, ${fullName || 'Scholar'}! Your journey begins. 🚀`, 'success')
      router.push('/dashboard')
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-mono flex items-center justify-center p-4">
      {/* Background subtle glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-indigo-100/60 via-slate-100/50 to-blue-100/50 blur-[140px]" />

      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 space-y-2"
        >
          <div className="flex justify-center mb-4">
            <Logo size={48} />
          </div>
          <h1 className="text-2xl font-black tracking-widest uppercase text-slate-900">
            INITIALIZING PROFILE
          </h1>
          <p className="text-xs text-slate-500 font-sans">
            Set your daily habits — we'll suggest the best study schedule to hit your target CGPA.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Name + Target CGPA */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <div className="text-[10px] font-extrabold tracking-widest text-indigo-600 uppercase mb-2">
              Your Identity
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-600">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  <Brain className="h-4 w-4 text-indigo-600" /> STARTING CGPA BASELINE
                </span>
                <span className="text-xl font-black text-indigo-600">{startingCgpa.toFixed(2)} CGPA</span>
              </div>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-[11px] text-slate-700 font-sans leading-relaxed">
                🎮 <strong className="text-indigo-800">Efficiency Scaling (3.00 – 3.50):</strong> Your starting baseline is calculated from your habit efficiency. Answer daily quizzes, complete quests, and submit essays to level up your CGPA to 10.00!
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <div className="text-[10px] font-extrabold tracking-widest text-emerald-600 uppercase mb-2">
              Quick Schedule Presets
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SUGGESTED_SCHEDULES.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                >
                  <div className="text-xs font-black text-slate-900 group-hover:text-indigo-600">{p.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Habit sliders */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
            <div className="text-[10px] font-extrabold tracking-widest text-amber-600 uppercase mb-2">
              Daily Habits (adjust each night)
            </div>
            <RangeSlider icon={<Moon className="h-4 w-4" />} label="Sleep" unit="hrs" min={3} max={12} step={0.5} value={sleep} onChange={setSleep} color="text-sky-600" />
            <RangeSlider icon={<BookOpen className="h-4 w-4" />} label="Study" unit="hrs" min={0} max={12} step={0.5} value={study} onChange={setStudy} color="text-indigo-600" />
            <RangeSlider icon={<Coffee className="h-4 w-4" />} label="Coffee" unit="cups" min={0} max={8} step={1} value={coffee} onChange={setCoffee} color="text-amber-600" />
            <RangeSlider icon={<Gamepad2 className="h-4 w-4" />} label="Gaming" unit="hrs" min={0} max={8} step={0.5} value={gaming} onChange={setGaming} color="text-rose-600" />

            {/* Live Energy/Stress readout */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-center">
                <div className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest">Energy</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">{energy}%</div>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-center">
                <div className="text-[10px] font-extrabold text-rose-700 uppercase tracking-widest">Stress</div>
                <div className="text-2xl font-black text-rose-600 mt-1">{stress}%</div>
              </div>
            </div>

            {/* AI schedule suggestion */}
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3 text-xs font-sans text-slate-700 leading-relaxed">
              💡 <strong className="text-indigo-800">AI Tip:</strong>{' '}
              {energy >= 70 && stress <= 50
                ? "Great balance! Your energy is high and stress is manageable. Keep this up for maximum CGPA growth."
                : energy < 50
                ? "Your energy is low. Try adding 1 more hour of sleep — it'll boost your quiz performance by ~15%."
                : "Stress is elevated. Consider reducing coffee or gaming by 1 unit to recover faster."}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60 transition-all"
          >
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> CREATING PROFILE...</> : <><Zap className="h-4 w-4 fill-current" /> ENTER THE SIMULATION <ArrowRight className="h-4 w-4" /></>}
          </button>
        </motion.form>
      </div>
    </div>
  )
}
