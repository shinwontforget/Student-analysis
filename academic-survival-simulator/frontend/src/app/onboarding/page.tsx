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
        <span className="text-sm font-black text-white font-mono">
          {value}<span className="text-xs text-zinc-500 ml-1">{unit}</span>
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-violet-500 cursor-pointer"
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
    <div className="min-h-screen bg-[#070712] text-zinc-100 font-mono flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-violet-600/20 via-purple-600/15 to-pink-500/10 blur-[140px]" />

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
          <h1 className="text-2xl font-black tracking-widest uppercase text-white">
            INITIALIZING PROFILE
          </h1>
          <p className="text-xs text-zinc-400 font-sans">
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
          <div className="rounded-3xl border border-white/10 bg-[#0d0c1d] p-6 space-y-4">
            <div className="text-[10px] font-extrabold tracking-widest text-violet-400 uppercase mb-2">
              Your Identity
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-white/10 bg-[#070712] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Brain className="h-4 w-4 text-violet-400" /> STARTING CGPA BASELINE
                </span>
                <span className="text-xl font-black text-violet-400">{startingCgpa.toFixed(2)} CGPA</span>
              </div>
              <div className="rounded-xl border border-violet-500/30 bg-violet-950/30 p-3 text-[11px] text-zinc-300 font-sans leading-relaxed">
                🎮 <strong className="text-violet-300">Efficiency Scaling (3.00 – 3.50):</strong> Your starting baseline is calculated from your habit efficiency. Answer daily quizzes, complete quests, and submit essays to level up your CGPA to 10.00!
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="rounded-3xl border border-white/10 bg-[#0d0c1d] p-6 space-y-4">
            <div className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase mb-2">
              Quick Schedule Presets
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SUGGESTED_SCHEDULES.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:border-violet-500/50 hover:bg-violet-950/20 transition-all group"
                >
                  <div className="text-xs font-black text-white group-hover:text-violet-300">{p.label}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Habit sliders */}
          <div className="rounded-3xl border border-white/10 bg-[#0d0c1d] p-6 space-y-5">
            <div className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase mb-2">
              Daily Habits (adjust each night)
            </div>
            <RangeSlider icon={<Moon className="h-4 w-4" />} label="Sleep" unit="hrs" min={3} max={12} step={0.5} value={sleep} onChange={setSleep} color="text-cyan-400" />
            <RangeSlider icon={<BookOpen className="h-4 w-4" />} label="Study" unit="hrs" min={0} max={12} step={0.5} value={study} onChange={setStudy} color="text-violet-400" />
            <RangeSlider icon={<Coffee className="h-4 w-4" />} label="Coffee" unit="cups" min={0} max={8} step={1} value={coffee} onChange={setCoffee} color="text-amber-400" />
            <RangeSlider icon={<Gamepad2 className="h-4 w-4" />} label="Gaming" unit="hrs" min={0} max={8} step={0.5} value={gaming} onChange={setGaming} color="text-pink-400" />

            {/* Live Energy/Stress readout */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-center">
                <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">Energy</div>
                <div className="text-2xl font-black text-emerald-300 mt-1">{energy}%</div>
              </div>
              <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-3 text-center">
                <div className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest">Stress</div>
                <div className="text-2xl font-black text-rose-300 mt-1">{stress}%</div>
              </div>
            </div>

            {/* AI schedule suggestion */}
            <div className="rounded-2xl border border-violet-500/20 bg-violet-950/10 p-3 text-xs font-sans text-zinc-300 leading-relaxed">
              💡 <strong className="text-violet-300">AI Tip:</strong>{' '}
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
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-violet-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:bg-violet-500 active:scale-[0.99] disabled:opacity-60 transition-all"
          >
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> CREATING PROFILE...</> : <><Zap className="h-4 w-4 fill-current" /> ENTER THE SIMULATION <ArrowRight className="h-4 w-4" /></>}
          </button>
        </motion.form>
      </div>
    </div>
  )
}
