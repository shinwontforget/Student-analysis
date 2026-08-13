'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Award,
  Zap,
  Coffee,
  Moon,
  Gamepad2,
  BookOpen,
  Brain,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Trophy,
  AlertTriangle,
  ArrowRight,
  BookPlus,
  Clock,
  Lock,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GamificationEngine } from '@/lib/services/gamificationEngine'
import MascotWidget from './MascotWidget'
import Logo from './Logo'
import { AvatarPicker, AvatarSVG, type AvatarId } from './Avatar'
import { LEVEL_LABELS, FIELDS_BY_LEVEL, FIELD_LABELS, type StudentLevel, type StudentField } from '@/data/essay-challenges'
import { WeeklyReviewModal } from './WeeklyReviewModal'
import { toast } from './Toast'

interface DashboardProps {
  user: {
    id: string
    email: string
    full_name?: string
    cgpa?: number
    is_premium?: boolean
    user_type?: string
    avatar_id?: AvatarId
    student_level?: StudentLevel
    student_field?: StudentField
  }
  isFirstTime?: boolean
}

const SUGGESTED_SCHEDULES = [
  { label: 'Warrior Mode',      sleep: 6,   study: 8,   coffee: 3, gaming: 1,   desc: 'Max grind, minimum rest.' },
  { label: 'Balanced Scholar',  sleep: 7.5, study: 5,   coffee: 2, gaming: 2,   desc: 'Sustainable daily routine.' },
  { label: 'Night Owl',         sleep: 5,   study: 7,   coffee: 4, gaming: 3,   desc: 'Late night power sessions.' },
  { label: 'Chill Student',     sleep: 9,   study: 4,   coffee: 1, gaming: 4,   desc: 'Life-study balance first.' },
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

interface SemesterEvent {
  week: number
  title: string
  desc: string
  type: 'quiz' | 'ghost' | 'burnout' | 'midterm' | 'normal'
  impact: { gpaDelta: number; sanityDelta: number }
}

const SEMESTER_EVENTS: Record<number, SemesterEvent> = {
  1: { week: 1, title: 'SYLLABUS SHOCK', desc: 'Overwhelmed by prerequisites.', type: 'normal', impact: { gpaDelta: -0.05, sanityDelta: -5 } },
  3: { week: 3, title: 'THE FIRST ALL-NIGHTER', desc: 'Pulled an all-nighter for lab report.', type: 'burnout', impact: { gpaDelta: 0.08, sanityDelta: -15 } },
  5: { week: 5, title: 'TEAMMATE GHOSTED', desc: 'Group member stopped answering DMs.', type: 'ghost', impact: { gpaDelta: -0.1, sanityDelta: -20 } },
  7: { week: 7, title: 'MIDTERM SEASON', desc: 'Back-to-back exams all week.', type: 'midterm', impact: { gpaDelta: 0.15, sanityDelta: -25 } },
  10: { week: 10, title: 'SURPRISE QUIZ', desc: 'Pop quiz on last week\'s lecture.', type: 'quiz', impact: { gpaDelta: 0.05, sanityDelta: -10 } },
  12: { week: 12, title: 'BURNOUT WAVE', desc: 'Mental fatigue hitting hard.', type: 'burnout', impact: { gpaDelta: -0.12, sanityDelta: -30 } },
  14: { week: 14, title: 'FINALS WEEK', desc: 'The ultimate survival test.', type: 'midterm', impact: { gpaDelta: 0.2, sanityDelta: -35 } },
}

export const Dashboard: React.FC<DashboardProps> = ({ user, isFirstTime = false }) => {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [showWeeklyModal, setShowWeeklyModal] = useState(false)

  // ── Onboarding Modal State ────────────────────────────────────────────────
  const [showOnboarding, setShowOnboarding] = useState<boolean>(isFirstTime)
  const [onboardName, setOnboardName] = useState<string>(user.full_name || '')
  const [obSleep, setObSleep]   = useState<number>(7.5)
  const [obStudy, setObStudy]   = useState<number>(5.0)
  const [obCoffee, setObCoffee] = useState<number>(2)
  const [obGaming, setObGaming] = useState<number>(2.0)

  // Onboarding step (0=avatar, 1=level+field, 2=habits)
  const [obStep, setObStep] = useState<0 | 1 | 2>(0)
  const [obAvatar, setObAvatar] = useState<AvatarId>('boy_1')
  const [obLevel, setObLevel] = useState<StudentLevel>('college')
  const [obField, setObField] = useState<StudentField>('computer_science')

  // Inline CGPA formula — avoids GamificationEngine returning 0 for default sliders
  // Sleep: 7.5h => sleepE=56, Coffee: 2 => coffeeE=16, Study: 5 => drainE=22.5, Gaming: 2 => gamingE=4
  // totalEnergy ≈ 56 + 16 - 22.5 + 4 = 53.5 => energy = 54
  const obEnergy = Math.max(0, Math.min(100, Math.round(
    Math.min(70, Math.round((obSleep / 8) * 60) + (obSleep > 8 ? (obSleep - 8) * 5 : 0)) +
    (obCoffee <= 4 ? obCoffee * 8 : 32 - (obCoffee - 4) * 6) -
    (obStudy * 4.5) +
    (obGaming <= 3 ? obGaming * 2 : 6 - (obGaming - 3) * 4)
  )))
  const obStress = Math.max(0, Math.min(100, Math.round(
    15 + (obStudy * 6.5) +
    (obSleep < 7 ? (7 - obSleep) * 8.5 : 0) +
    (obCoffee > 3 ? (obCoffee - 3) * 7.5 : 0) +
    (obGaming <= 3 ? -obGaming * 5.5 : -16.5 + (obGaming - 3) * 8)
  )))
  const obStartingCgpa = parseFloat((
    3.00 + Math.min(0.50, Math.max(0.00,
      (obEnergy * 0.003) + (obStudy >= 6 ? 0.15 : 0.05) - (obStress > 60 ? 0.10 : 0)
    ))
  ).toFixed(2))

  // ── Revision Shelf Status ─────────────────────────────────────────────────
  const [shelfCount, setShelfCount] = useState<number | null>(null)

  useEffect(() => {
    async function checkShelf() {
      const { count } = await supabase
        .from('revision_shelf')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setShelfCount(count ?? 0)
    }
    if (!showOnboarding) checkShelf()
  }, [user.id, showOnboarding])

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const { error: profileError } = await supabase.from('users').upsert({
        id: user.id,
        email: user.email ?? '',
        full_name: onboardName.trim() || (user.email?.split('@')[0] ?? 'Scholar'),
        cgpa: obStartingCgpa,
        is_premium: false,
        user_type: 'student',
        avatar_id: obAvatar,
        student_level: obLevel,
        student_field: obField,
      })

      if (profileError) {
        toast('Failed to save profile: ' + profileError.message, 'error')
        return
      }

      await supabase.from('daily_habit_logs').upsert({
        user_id: user.id,
        logged_date: new Date().toISOString().split('T')[0],
        sleep_hrs: obSleep,
        study_hrs: obStudy,
        coffee_cups: obCoffee,
        gaming_hrs: obGaming,
        energy: obEnergy,
        stress: obStress,
      }, { onConflict: 'user_id,logged_date' })

      toast(`🚀 Welcome, ${onboardName || 'Scholar'}! Starting CGPA: ${obStartingCgpa}`, 'success')
      setShowOnboarding(false)
    })
  }

  // ── Sliders State (for daily habit tracking on dashboard) ─────────────────
  const [sleep, setSleep]   = useState<number>(7.5)
  const [study, setStudy]   = useState<number>(6.0)
  const [coffee, setCoffee] = useState<number>(3)
  const [gaming, setGaming] = useState<number>(2.0)

  // Live Student CGPA
  const [liveCgpa, setLiveCgpa] = useState<number>(user.cgpa ?? 3.0)

  // Real-Time Calendar Progression (7 real world days per semester week)
  const [currentWeek, setCurrentWeek] = useState<number>(1)
  const [dayInWeek, setDayInWeek] = useState<number>(1)
  const [semesterLog, setSemesterLog] = useState<SemesterEvent[]>([SEMESTER_EVENTS[1]])
  const [simulationGpa, setSimulationGpa] = useState<number>(user.cgpa ?? 3.0)
  const [sanityLevel, setSanityLevel] = useState<number>(85)

  // Real 7-day Summary Stats for Modal
  const [weeklyStats, setWeeklyStats] = useState<{
    quizzesCompleted: number
    avgScorePct: number
    examsSubmitted: number
    cgpaChange: number
    weeklyTip: string
  } | null>(null)

  // Energy & Stress
  const { energy, stress } = GamificationEngine.calculateEnergyStress({ sleep, study, coffee, gaming })

  // Fetch real 7-day report from Supabase
  const loadWeeklyReport = async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // 1. Quizzes completed in last 7 days
      const { data: qAttempts } = await supabase
        .from('quiz_attempts')
        .select('score_pct, cgpa_delta')
        .eq('user_id', user.id)
        .gte('attempted_at', sevenDaysAgo)

      const quizzesCompleted = qAttempts?.length || 0
      const avgScorePct = quizzesCompleted > 0
        ? Math.round(qAttempts!.reduce((sum, q) => sum + (Number(q.score_pct) || 0), 0) / quizzesCompleted)
        : 0
      const quizDeltaSum = qAttempts
        ? qAttempts.reduce((sum, q) => sum + (Number(q.cgpa_delta) || 0), 0)
        : 0

      // 2. Critical Thinking written exams in last 7 days
      const { data: ctSubs } = await supabase
        .from('critical_thinking_submissions')
        .select('quality_score, uniqueness_score')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo)

      const examsSubmitted = ctSubs?.length || 0
      const ctDeltaSum = ctSubs
        ? ctSubs.reduce((sum, ct) => sum + (((ct.quality_score || 0) + (ct.uniqueness_score || 0)) / 200) * 0.05, 0)
        : 0

      const total7DayDelta = parseFloat((quizDeltaSum + ctDeltaSum).toFixed(2))

      // Contextual AI advisor tip
      let tip = 'No activity recorded yet in the last 7 days. Complete daily quizzes from your Revision Shelf to build CGPA momentum!'
      if (quizzesCompleted >= 5 && avgScorePct >= 80) {
        tip = 'Fantastic academic consistency! Your high quiz accuracy is creating solid daily CGPA gains.'
      } else if (quizzesCompleted > 0 && avgScorePct < 65) {
        tip = 'Quiz accuracy is below 65%. Review explanations on your Revision Shelf before taking quizzes.'
      } else if (quizzesCompleted > 0 && examsSubmitted === 0) {
        tip = 'Great quiz progress! Challenge yourself with the daily Critical Thinking section to earn up to 200 points.'
      } else if (quizzesCompleted > 0) {
        tip = 'Consistent daily practice is key. Keep maintaining 7+ hours of sleep for peak cognitive retention.'
      }

      setWeeklyStats({
        quizzesCompleted,
        avgScorePct,
        examsSubmitted,
        cgpaChange: total7DayDelta,
        weeklyTip: tip,
      })
    } catch (e) {
      console.error('Error loading weekly report:', e)
    }
  }

  // Load user data, real week elapsed, today's habit log, and trigger daily rollup
  useEffect(() => {
    async function loadUserDataAndRollup() {
      const todayStr = new Date().toISOString().split('T')[0]

      // 1. Fetch user record for start date and CGPA
      const { data: profile } = await supabase
        .from('users')
        .select('cgpa, created_at, semester_start_date')
        .eq('id', user.id)
        .single()

      if (profile) {
        if (profile.cgpa !== undefined) {
          setLiveCgpa(Number(profile.cgpa))
          setSimulationGpa(Number(profile.cgpa))
        }

        // Calculate real elapsed weeks (7 real calendar days per week)
        const startDate = profile.semester_start_date || profile.created_at || new Date().toISOString()
        const diffMs = Math.max(0, Date.now() - new Date(startDate).getTime())
        const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const realWeekNum = Math.min(14, Math.max(1, Math.floor(daysElapsed / 7) + 1))
        const currentDayOf7 = (daysElapsed % 7) + 1

        setCurrentWeek(realWeekNum)
        setDayInWeek(currentDayOf7)
        
        // Populate event log with all weeks unlocked so far (in reverse chronological order)
        const logs: SemesterEvent[] = []
        for (let w = 1; w <= realWeekNum; w++) {
          if (SEMESTER_EVENTS[w]) {
            logs.push(SEMESTER_EVENTS[w])
          } else {
            logs.push({
              week: w,
              title: `WEEK ${w} PROGRESSION`,
              desc: 'Term study and practice session.',
              type: 'normal',
              impact: { gpaDelta: 0.02, sanityDelta: 0 },
            })
          }
        }
        setSemesterLog(logs.reverse())
      }

      // 2. Load today's habit log
      const { data: habitData } = await supabase
        .from('daily_habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('logged_date', todayStr)
        .maybeSingle()

      if (habitData) {
        if (habitData.sleep_hrs) setSleep(Number(habitData.sleep_hrs))
        if (habitData.study_hrs) setStudy(Number(habitData.study_hrs))
        if (habitData.coffee_cups) setCoffee(Number(habitData.coffee_cups))
        if (habitData.gaming_hrs) setGaming(Number(habitData.gaming_hrs))
      }

      // 3. Trigger daily rollup for yesterday's activities
      try {
        const rollupRes = await fetch('/api/daily-rollup', { method: 'POST' })
        const rollupData = await rollupRes.json()
        if (rollupRes.ok && rollupData.rolledUp) {
          setLiveCgpa(rollupData.newCgpa)
          setSimulationGpa(rollupData.newCgpa)
          toast(`📈 Daily Rollup Applied: CGPA updated to ${rollupData.newCgpa.toFixed(2)} (${rollupData.totalAccumulatedDelta >= 0 ? '+' : ''}${rollupData.totalAccumulatedDelta.toFixed(2)}) based on your yesterday's work!`, 'success')
        }
      } catch {
        // Rollup error handled silently
      }

      // 4. Load real 7-day stats
      loadWeeklyReport()
    }

    loadUserDataAndRollup()
  }, [user.id])

  // Save habit slider changes to Supabase
  const handleHabitChange = async (type: 'sleep' | 'study' | 'coffee' | 'gaming', val: number) => {
    if (type === 'sleep') setSleep(val)
    if (type === 'study') setStudy(val)
    if (type === 'coffee') setCoffee(val)
    if (type === 'gaming') setGaming(val)

    const updated = {
      sleep: type === 'sleep' ? val : sleep,
      study: type === 'study' ? val : study,
      coffee: type === 'coffee' ? val : coffee,
      gaming: type === 'gaming' ? val : gaming,
    }

    const newCalcs = GamificationEngine.calculateEnergyStress(updated)
    const todayStr = new Date().toISOString().split('T')[0]

    await supabase.from('daily_habit_logs').upsert({
      user_id: user.id,
      logged_date: todayStr,
      sleep_hrs: updated.sleep,
      study_hrs: updated.study,
      coffee_cups: updated.coffee,
      gaming_hrs: updated.gaming,
      energy: newCalcs.energy,
      stress: newCalcs.stress,
    }, { onConflict: 'user_id,logged_date' })
  }

  // Calculate dynamic projected GPA based on habit sliders
  const projectedGpa = Math.min(
    10.0,
    Math.max(
      1.0,
      parseFloat(
        (
          liveCgpa +
          (sleep >= 7 ? 0.3 : -0.2) +
          (study >= 6 ? 0.4 : 0.1) -
          (coffee > 5 ? 0.3 : 0) -
          (gaming > 4 ? 0.3 : 0)
        ).toFixed(2)
      )
    )
  )

  return (
    <div className="min-h-screen bg-[#070712] text-zinc-100 p-4 sm:p-8 space-y-12 font-mono select-none">

      {/* ====================================================================== */}
      {/* FIRST-TIME ONBOARDING MODAL OVERLAY                                    */}
      {/* ====================================================================== */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#070712]/95 backdrop-blur-xl overflow-y-auto"
          >
            <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-tr from-violet-600/20 via-purple-600/15 to-pink-500/10 blur-[140px]" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="relative w-full max-w-2xl my-8"
            >
              {/* Logo + Title */}
              <div className="text-center mb-5 space-y-1">
                <div className="flex justify-center mb-2"><Logo size={40} /></div>
                <h2 className="text-2xl font-black tracking-widest uppercase text-white">
                  {obStep === 0 ? 'CHOOSE YOUR SCHOLAR' : obStep === 1 ? 'SELECT YOUR FIELD' : 'SET YOUR HABITS'}
                </h2>
                <p className="text-xs text-zinc-500 font-sans">
                  Step {obStep + 1} of 3
                </p>
                {/* Step progress */}
                <div className="flex gap-2 justify-center pt-1">
                  {[0, 1, 2].map((s) => (
                    <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= obStep ? 'bg-violet-500 w-12' : 'bg-white/10 w-8'}`} />
                  ))}
                </div>
              </div>

              {/* STEP 0 — AVATAR PICKER */}
              {obStep === 0 && (
                <div className="rounded-3xl border border-white/10 bg-[#0d0c1d] p-6 space-y-5">
                  <AvatarPicker selected={obAvatar} onSelect={setObAvatar} />
                  <button
                    type="button"
                    onClick={() => setObStep(1)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-violet-600 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-violet-500 transition-all shadow-[0_0_24px_rgba(139,92,246,0.35)]"
                  >
                    NEXT — SELECT YOUR FIELD <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* STEP 1 — LEVEL + FIELD */}
              {obStep === 1 && (
                <div className="space-y-4">
                  {/* Level selector */}
                  <div className="rounded-3xl border border-white/10 bg-[#0d0c1d] p-6 space-y-3">
                    <div className="text-[10px] font-extrabold tracking-widest text-violet-400 uppercase">Your Education Level</div>
                    <div className="grid grid-cols-2 gap-3">
                      {(Object.entries(LEVEL_LABELS) as [StudentLevel, string][]).map(([lvl, label]) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => {
                            setObLevel(lvl)
                            const fields = FIELDS_BY_LEVEL[lvl]
                            setObField(fields[0])
                          }}
                          className={`rounded-2xl border p-3 text-left transition-all ${
                            obLevel === lvl
                              ? 'border-violet-500 bg-violet-950/50 text-white'
                              : 'border-white/10 bg-white/5 text-zinc-400 hover:border-violet-400/40'
                          }`}
                        >
                          <div className="text-sm font-black">{label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field selector */}
                  <div className="rounded-3xl border border-white/10 bg-[#0d0c1d] p-6 space-y-3">
                    <div className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase">Your Subject Area</div>
                    <div className="grid grid-cols-2 gap-2">
                      {FIELDS_BY_LEVEL[obLevel].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setObField(f)}
                          className={`rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition-all ${
                            obField === f
                              ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                              : 'border-white/10 bg-white/5 text-zinc-400 hover:border-emerald-400/40'
                          }`}
                        >
                          {FIELD_LABELS[f]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setObStep(0)} className="flex-1 rounded-2xl border border-white/10 py-3 text-xs font-bold uppercase text-zinc-400 hover:border-white/20 transition-all">← BACK</button>
                    <button type="button" onClick={() => setObStep(2)} className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3 text-xs font-black uppercase text-white hover:bg-violet-500 transition-all">
                      NEXT — SET HABITS <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2 — NAME + HABITS + CGPA */}
              {obStep === 2 && (
                <form onSubmit={handleOnboardingSubmit} className="space-y-4">
                  {/* Identity */}
                  <div className="rounded-3xl border border-white/10 bg-[#0d0c1d] p-6 space-y-4">
                    <div className="text-[10px] font-extrabold tracking-widest text-violet-400 uppercase">Your Identity</div>

                    <div className="flex items-center gap-4">
                      <AvatarSVG avatarId={obAvatar} size={56} />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={onboardName}
                          onChange={(e) => setOnboardName(e.target.value)}
                          placeholder="Your full name..."
                          className="w-full rounded-xl border border-white/10 bg-[#070712] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                        />
                        <div className="text-[10px] text-zinc-500 mt-1 font-sans">{LEVEL_LABELS[obLevel]} · {FIELD_LABELS[obField]}</div>
                      </div>
                    </div>

                    {/* Live CGPA Preview */}
                    <div className="flex items-center justify-between rounded-xl border border-violet-500/30 bg-violet-950/30 px-4 py-3">
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-violet-400">Starting CGPA</div>
                        <div className="text-[11px] text-zinc-400 font-sans mt-0.5">Grows only through quizzes & written exams</div>
                      </div>
                      <div className="text-3xl font-black text-violet-300">{obStartingCgpa.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="rounded-3xl border border-white/10 bg-[#0d0c1d] p-6 space-y-3">
                    <div className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase">Quick Presets</div>
                    <div className="grid grid-cols-2 gap-3">
                      {SUGGESTED_SCHEDULES.map((p) => (
                        <button key={p.label} type="button"
                          onClick={() => { setObSleep(p.sleep); setObStudy(p.study); setObCoffee(p.coffee); setObGaming(p.gaming) }}
                          className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:border-violet-500/50 hover:bg-violet-950/20 transition-all group"
                        >
                          <div className="text-xs font-black text-white group-hover:text-violet-300">{p.label}</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Habit Sliders */}
                  <div className="rounded-3xl border border-white/10 bg-[#0d0c1d] p-6 space-y-5">
                    <div className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">Daily Habits</div>
                    <RangeSlider icon={<Moon className="h-4 w-4" />}     label="Sleep"  unit="hrs"  min={3}   max={12} step={0.5} value={obSleep}  onChange={setObSleep}  color="text-cyan-400" />
                    <RangeSlider icon={<BookOpen className="h-4 w-4" />} label="Study"  unit="hrs"  min={0}   max={12} step={0.5} value={obStudy}  onChange={setObStudy}  color="text-violet-400" />
                    <RangeSlider icon={<Coffee className="h-4 w-4" />}   label="Coffee" unit="cups" min={0}   max={8}  step={1}   value={obCoffee} onChange={setObCoffee} color="text-amber-400" />
                    <RangeSlider icon={<Gamepad2 className="h-4 w-4" />} label="Gaming" unit="hrs"  min={0}   max={8}  step={0.5} value={obGaming} onChange={setObGaming} color="text-pink-400" />

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-center">
                        <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">Energy</div>
                        <div className="text-2xl font-black text-emerald-300 mt-1">{obEnergy}%</div>
                      </div>
                      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-3 text-center">
                        <div className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest">Stress</div>
                        <div className="text-2xl font-black text-rose-300 mt-1">{obStress}%</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-violet-500/20 bg-violet-950/10 p-3 text-xs font-sans text-zinc-300 leading-relaxed">
                      💡 <strong className="text-violet-300">AI Tip:</strong>{' '}
                      {obEnergy >= 70 && obStress <= 50
                        ? 'Great balance! High energy & low stress = fast CGPA growth.'
                        : obEnergy < 50
                        ? 'Low energy detected. Add 1+ hr sleep to boost quiz performance ~15%.'
                        : 'Stress is elevated. Reduce coffee or gaming by 1 unit to recover faster.'}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setObStep(1)} className="rounded-2xl border border-white/10 px-5 py-4 text-xs font-bold uppercase text-zinc-400 hover:border-white/20 transition-all">← BACK</button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-violet-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:bg-violet-500 active:scale-[0.99] disabled:opacity-60 transition-all"
                    >
                      {isPending
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> CREATING PROFILE...</>
                        : <><Zap className="h-4 w-4 fill-current" /> ENTER THE SIMULATION <ArrowRight className="h-4 w-4" /></>}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>





      {/* ====================================================================== */}
      {/* REVISION SHELF EMPTY NUDGE BANNER                                      */}
      {/* ====================================================================== */}
      {!showOnboarding && shelfCount === 0 && (
        <div className="flex items-start gap-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 px-5 py-4">
          <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-black uppercase tracking-wider text-amber-300">Your Revision Shelf is empty!</div>
            <div className="text-[11px] text-zinc-400 font-sans mt-0.5">Add topics to your Revision Shelf so you can take targeted daily quizzes and grow your CGPA. Your CGPA only changes through quizzes &amp; critical thinking.</div>
          </div>
          <Link
            href="/revision-shelf"
            className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-all shrink-0 uppercase tracking-wider"
          >
            <BookPlus className="h-3.5 w-3.5" /> ADD NOTES
          </Link>
        </div>
      )}
      
      {/* Weekly Review Modal */}
      <WeeklyReviewModal
        isOpen={showWeeklyModal}
        onClose={() => setShowWeeklyModal(false)}
        user={{
          full_name: user.full_name || 'Scholar',
          avatar_id: obAvatar,
          student_level: obLevel,
          student_field: obField,
          cgpa: liveCgpa,
        }}
        stats={weeklyStats || undefined}
      />

      {/* ==================================================================== */}
      {/* SECTION 1: ACADEMIC SIMULATION ENGINE                                */}
      {/* ==================================================================== */}
      <section className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-violet-400">
              <Zap className="h-3.5 w-3.5 fill-current" /> REAL-TIME SEMESTER TRACKER
              <span className="text-zinc-500">•</span>
              <span className="text-emerald-400">{LEVEL_LABELS[obLevel] || 'College'}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-cyan-400 font-bold">DAY {dayInWeek} OF 7</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-widest uppercase text-white mt-1">
              {obLevel === 'school_9_10'
                ? `CLASS 9-10 ACADEMIC YEAR — WEEK ${currentWeek} / 14`
                : obLevel === 'school_11_12'
                ? `CLASS 11-12 BOARD SIMULATOR — WEEK ${currentWeek} / 14`
                : `SEMESTER SIMULATION — WEEK ${currentWeek} / 14`}
            </h1>
            <p className="text-xs text-zinc-400 font-sans tracking-wide max-w-2xl mt-1">
              Synchronized with real calendar time (7 real-world days per week). CGPA updates at the end of each working day based on your daily quizzes and critical thinking assessments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                loadWeeklyReport()
                setShowWeeklyModal(true)
              }}
              className="flex items-center gap-1.5 rounded-2xl border border-violet-500/30 bg-violet-950/40 px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-violet-300 hover:bg-violet-900/40 transition-all"
            >
              <Calendar className="h-4 w-4 text-violet-400" /> 7-DAY SUMMARY
            </button>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0d0c1d] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-300 shadow-lg">
              {currentWeek >= 14 ? (
                <>
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-300">TERM COMPLETE</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-violet-400 animate-pulse" />
                  <span className="text-zinc-400">
                    WEEK {currentWeek + 1} UNLOCKS IN:{' '}
                    <strong className="text-white font-mono">
                      {7 - dayInWeek === 0 ? 'TOMORROW' : `${7 - dayInWeek} ${7 - dayInWeek === 1 ? 'DAY' : 'DAYS'}`}
                    </strong>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3 Status Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Sanity Levels */}
          <div className="rounded-2xl border border-white/10 bg-[#0d0c1e] p-5">
            <div className="flex items-center justify-between mb-3 text-zinc-400">
              <span className="text-[10px] font-extrabold uppercase tracking-widest">SANITY LEVEL</span>
              <span className="text-xs font-bold text-emerald-400">{sanityLevel}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${sanityLevel}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-sans mt-2">
              {sanityLevel >= 70 ? 'Mental state is optimal.' : sanityLevel >= 40 ? 'Slight fatigue setting in.' : 'Severe burnout warning!'}
            </p>
          </div>

          {/* Current Sim GPA */}
          <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-5">
            <div className="flex items-center justify-between mb-1 text-violet-400">
              <span className="text-[10px] font-extrabold uppercase tracking-widest">SIMULATED CGPA</span>
              <Brain className="h-4 w-4" />
            </div>
            <div className="text-3xl font-black text-white mt-1">
              {simulationGpa.toFixed(2)}
            </div>
            <p className="text-[10px] text-zinc-400 font-sans mt-1">
              Target: 10.00 • Delta this week: {SEMESTER_EVENTS[currentWeek]?.impact.gpaDelta ?? 0 >= 0 ? '+' : ''}{SEMESTER_EVENTS[currentWeek]?.impact.gpaDelta ?? 0}
            </p>
          </div>

          {/* Burnout Risk */}
          <div className="rounded-2xl border border-white/10 bg-[#0d0c1e] p-5">
            <div className="flex items-center justify-between mb-3 text-zinc-400">
              <span className="text-[10px] font-extrabold uppercase tracking-widest">BURNOUT RISK</span>
              <span className="text-xs font-bold text-rose-400">{100 - sanityLevel}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${100 - sanityLevel}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-sans mt-2">
              High coffee & low sleep increase risk exponentially.
            </p>
          </div>
        </div>

        {/* 14-Week Simulation Graph Bar */}
        <div className="rounded-3xl border border-white/10 bg-[#0d0c1d] p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase">
            <span>WEEKLY CGPA TRAJECTORY</span>
            <span className="text-violet-400">W{currentWeek} OF W14</span>
          </div>

          <div className="grid grid-cols-14 gap-1.5 h-32 items-end pt-4 border-b border-white/10 pb-4">
            {Array.from({ length: 14 }).map((_, idx) => {
              const weekNum = idx + 1
              const isPast = weekNum <= currentWeek
              const isCurrent = weekNum === currentWeek

              return (
                <div key={weekNum} className="flex flex-col items-center gap-2 h-full justify-end">
                  {weekNum > currentWeek ? (
                    <div className="w-full h-10 rounded-t-lg bg-zinc-900/80 border border-dashed border-white/10 flex items-center justify-center">
                      <Lock className="h-3 w-3 text-zinc-600" />
                    </div>
                  ) : (
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isCurrent
                          ? 'bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.6)]'
                          : 'bg-violet-900/60'
                      }`}
                      style={{ height: `${Math.min(100, ((simulationGpa + (weekNum % 3) * 0.2) / 10) * 100)}%` }}
                    />
                  )}
                  <span className={`text-[9px] font-bold ${isCurrent ? 'text-violet-300 font-extrabold' : weekNum > currentWeek ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    W{weekNum}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Academic Event Log */}
          <div className="space-y-2 pt-2">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
              SEMESTER EVENT LOG
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {semesterLog.map((ev, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-[#070712] p-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-violet-950/80 border border-violet-500/30 px-2 py-1 text-[10px] font-black text-violet-300">
                      W{ev.week}
                    </span>
                    <div>
                      <div className="font-extrabold text-white">{ev.title}</div>
                      <div className="text-[10px] text-zinc-400 font-sans">{ev.desc}</div>
                    </div>
                  </div>

                  <div className="text-right text-[10px] font-mono">
                    <span className={ev.impact.gpaDelta >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {ev.impact.gpaDelta >= 0 ? '+' : ''}{ev.impact.gpaDelta} GPA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 2: CHARACTER SHEET (HABIT SLIDERS)                          */}
      {/* ==================================================================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
            CHARACTER SHEET — DAILY HABIT SLIDERS
          </h2>
          <p className="text-xs text-zinc-400 font-sans mt-1">
            Adjust your nightly routines. Changes are saved automatically to your profile.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Sliders (4 cols) */}
          <div className="lg:col-span-4 rounded-3xl border border-white/10 bg-[#0c0b1d] p-6 space-y-6">
            {/* Sleep */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-cyan-400">
                <span className="flex items-center gap-2 uppercase"><Moon className="h-4 w-4" /> Sleep</span>
                <span className="font-black text-white">{sleep} hrs</span>
              </div>
              <input
                type="range" min={3} max={12} step={0.5} value={sleep}
                onChange={(e) => handleHabitChange('sleep', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Study */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-violet-400">
                <span className="flex items-center gap-2 uppercase"><BookOpen className="h-4 w-4" /> Study</span>
                <span className="font-black text-white">{study} hrs</span>
              </div>
              <input
                type="range" min={0} max={12} step={0.5} value={study}
                onChange={(e) => handleHabitChange('study', parseFloat(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
            </div>

            {/* Coffee */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-amber-400">
                <span className="flex items-center gap-2 uppercase"><Coffee className="h-4 w-4" /> Coffee</span>
                <span className="font-black text-white">{coffee} cups</span>
              </div>
              <input
                type="range" min={0} max={8} step={1} value={coffee}
                onChange={(e) => handleHabitChange('coffee', parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Gaming */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-pink-400">
                <span className="flex items-center gap-2 uppercase"><Gamepad2 className="h-4 w-4" /> Gaming</span>
                <span className="font-black text-white">{gaming} hrs</span>
              </div>
              <input
                type="range" min={0} max={8} step={0.5} value={gaming}
                onChange={(e) => handleHabitChange('gaming', parseFloat(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

            {/* Readouts */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div>
                <div className="flex justify-between text-xs font-bold text-emerald-400 mb-1">
                  <span>⚡ ENERGY</span>
                  <span>{energy}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${energy}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-rose-400 mb-1">
                  <span>🔥 STRESS</span>
                  <span>{stress}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
                  <div className="h-full bg-rose-500 transition-all" style={{ width: `${stress}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Radar Chart & Projected GPA (4 cols) */}
          <div className="lg:col-span-4 rounded-3xl border border-violet-500/40 bg-[#0c0b1d] p-6 flex flex-col justify-between items-center text-center shadow-[0_0_40px_rgba(139,92,246,0.1)]">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block mb-1">
                CURRENT CLASS
              </span>
              <h3 className="text-xl font-black uppercase tracking-wider text-violet-300">
                THE BALANCED WANDERER
              </h3>
            </div>

            {/* SVG Radar Chart */}
            <div className="my-4 relative h-40 w-40 flex items-center justify-center">
              <svg className="h-full w-full" viewBox="0 0 100 100">
                <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="none" stroke="#ffffff15" strokeWidth="1" />
                <polygon points="50,25 72,37 72,63 50,75 28,63 28,37" fill="none" stroke="#ffffff15" strokeWidth="1" />
                <polygon
                  points={`50,${20 + (12 - sleep) * 2} ${50 + study * 2.5},${35 - study} ${50 + coffee * 2},${65 + coffee} 50,${80 - gaming * 2} ${35 - stress * 0.2},65 ${25 + energy * 0.2},35`}
                  fill="rgba(139,92,246,0.3)"
                  stroke="#a78bfa"
                  strokeWidth="1.5"
                />
              </svg>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block">
                PROJECTED GPA
              </span>
              <span className="text-4xl font-black text-amber-300 tracking-tight">
                {projectedGpa.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Column 3: Mascot & Achievements (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-[#0c0b1d] p-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/40 bg-violet-600/20 text-3xl shrink-0 shadow-lg">
                🦉
              </div>
              <p className="text-xs text-zinc-300 font-sans italic leading-relaxed">
                &quot;Steady progress. Adjust your schedule tonight for optimum energy.&quot;
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0c0b1d] p-5 space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 pb-2 border-b border-white/10">
                ACHIEVEMENTS
              </div>

              <div className="space-y-2">
                <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-xs">
                  <div className="font-bold text-white uppercase text-[11px] mb-0.5">WELL RESTED</div>
                  <p className="text-[10px] text-zinc-500 font-sans">Log 8 or more hours of sleep.</p>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-xs">
                  <div className="font-bold text-white uppercase text-[11px] mb-0.5">DEEP WORK</div>
                  <p className="text-[10px] text-zinc-500 font-sans">Grind 8+ hours of focused study.</p>
                </div>

                <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-xs shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <div className="font-bold text-amber-300 uppercase text-[11px] mb-0.5 flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5" /> BALANCED BUILD
                  </div>
                  <p className="text-[10px] text-amber-200/80 font-sans">Keep energy above 70 while studying.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REACTIVE MASCOT WIDGET */}
      <MascotWidget energy={energy} stress={stress} studentName={user.full_name || 'Scholar'} />
    </div>
  )
}

export default Dashboard
