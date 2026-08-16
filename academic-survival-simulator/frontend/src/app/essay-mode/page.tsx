'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Award,
  BookOpen,
  RefreshCw,
  Clock,
  Play,
  Pause,
  ChevronRight,
  ShieldAlert,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  EXAM_PROMPTS,
  FIELD_LABELS,
  LEVEL_LABELS,
  getPromptsForUser,
  ExamPrompt,
  StudentLevel,
  StudentField,
} from '@/data/essay-challenges'
import { toast } from '@/components/Toast'

export default function EssayModePage() {
  const supabase = createClient()

  // User Profile State
  const [userProfile, setUserProfile] = useState<{
    id: string
    full_name: string
    cgpa: number
    student_level: StudentLevel
    student_field: StudentField
  } | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // 5 Exam Questions for User's Field/Level
  const [examPrompts, setExamPrompts] = useState<ExamPrompt[]>([])
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [evaluations, setEvaluations] = useState<Record<string, any>>({})
  const [evaluatingQuestionId, setEvaluatingQuestionId] = useState<string | null>(null)

  // 60-Minute Exam Timer State (in seconds)
  const [timeLeft, setTimeLeft] = useState<number>(60 * 60)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)

  // Load User and 5 Field-Specific Exam Prompts
  useEffect(() => {
    async function loadUser() {
      setLoadingUser(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, full_name, cgpa, student_level, student_field')
          .eq('id', user.id)
          .single()

        if (profile) {
          const lvl = (profile.student_level as StudentLevel) || 'college'
          const fld = (profile.student_field as StudentField) || 'computer_science'
          const cgpa = Number(profile.cgpa) || 3.0

          setUserProfile({
            id: profile.id,
            full_name: profile.full_name || 'Scholar',
            cgpa,
            student_level: lvl,
            student_field: fld,
          })

          const prompts = getPromptsForUser(fld, lvl)
          const fivePrompts = prompts.length >= 5 ? prompts.slice(0, 5) : prompts
          setExamPrompts(fivePrompts)
        }
      }
      setLoadingUser(false)
    }
    loadUser()
  }, [])

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isUnlocked = (userProfile?.cgpa ?? 0) >= 7.50
  const activePrompt = examPrompts[activeQuestionIdx] || examPrompts[0]
  const currentAnswer = activePrompt ? (answers[activePrompt.id] || '') : ''
  const currentEval = activePrompt ? evaluations[activePrompt.id] : null

  const handleEvaluateCurrent = async () => {
    if (!activePrompt || !currentAnswer.trim() || !userProfile) return

    setEvaluatingQuestionId(activePrompt.id)
    try {
      const res = await fetch('/api/evaluate-thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: activePrompt.id,
          prompt: activePrompt.promptText,
          answerText: currentAnswer.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setEvaluations((prev) => ({ ...prev, [activePrompt.id]: data.evaluation }))
        toast(`Question ${activeQuestionIdx + 1} Evaluated! Score: ${data.evaluation.quality_score + data.evaluation.uniqueness_score}/200`, 'success')
      } else {
        toast(data.error || 'Evaluation failed.', 'error')
      }
    } catch {
      toast('Error submitting response.', 'error')
    } finally {
      setEvaluatingQuestionId(null)
    }
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="text-xs font-mono text-slate-500">Loading Honor Exam Arena...</span>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-4 sm:p-8 space-y-6 select-none">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                Honors Examination Division
              </span>
              <span className="text-xs text-slate-500 font-mono">
                1-Hour • 5-Question Subjective Session
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-600" /> Comprehensive Subjective Exam
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Rigorous 5-question examination for {userProfile ? FIELD_LABELS[userProfile.student_field] : 'your discipline'}. Evaluated by Gemini AI for depth, originality, and analytical synthesis.
            </p>
          </div>

          {/* Status Pill */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className={`rounded-xl border px-4 py-2 text-xs font-bold flex items-center gap-2 ${
                isUnlocked
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {isUnlocked ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> MERIT UNLOCKED (CGPA ≥ 7.50)
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-rose-500" /> MERIT LOCKED (CGPA &lt; 7.50)
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── STATE 1: LOCKED (CGPA < 7.50) ─────────────────────────────────── */}
        {!isUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 text-center space-y-6 shadow-sm"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 mx-auto">
              <Lock className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <span className="rounded-full bg-rose-50 text-rose-700 text-[10px] font-extrabold px-3 py-1 uppercase border border-rose-200 tracking-wider">
                ACADEMIC MERIT GATE
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold uppercase text-slate-900 tracking-wide">
                HONOR EXAM IS LOCKED
              </h2>
              <p className="text-xs text-slate-500 font-sans max-w-md mx-auto leading-relaxed">
                The 1-Hour 5-Question Subjective Examination is reserved for students who maintain a <strong className="text-indigo-700 font-mono">CGPA of 7.50 or higher</strong> through daily revision quizzes and critical thinking assessments.
              </p>
            </div>

            {/* CGPA Progress Meter */}
            <div className="max-w-sm mx-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 font-mono">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">YOUR CURRENT CGPA</span>
                <span className="text-indigo-700">{userProfile?.cgpa.toFixed(2)} / 7.50</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, ((userProfile?.cgpa ?? 0) / 7.5) * 100))}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 text-right">
                {((7.5 - (userProfile?.cgpa ?? 0)) > 0)
                  ? `+${(7.5 - (userProfile?.cgpa ?? 0)).toFixed(2)} CGPA needed to unlock`
                  : 'Condition Met!'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/quest-log"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
              >
                <Zap className="h-4 w-4 fill-current" /> TAKE DAILY QUIZ (BOOST CGPA)
              </Link>
            </div>
          </motion.div>
        )}

        {/* ── STATE 2: UNLOCKED (CGPA >= 7.50) ───────────────────────────────── */}
        {isUnlocked && (
          <div className="space-y-6">
            {/* Top Exam Status & Countdown Timer Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 px-6 py-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
                  <Clock className="h-4 w-4 text-indigo-600" /> OFFICIAL 60-MINUTE TIMED EXAMINATION
                </div>
                <div className="text-xs text-indigo-800/80 font-sans">
                  {userProfile ? FIELD_LABELS[userProfile.student_field] : 'Academic'} • 5 In-depth Subjective Prompts (Max 1000 Pts Total)
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-xs self-stretch md:self-auto justify-between">
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${isTimerRunning ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />
                  <span className={`text-lg font-bold font-mono ${timeLeft < 300 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsTimerRunning((v) => !v)}
                    className="p-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 transition-colors text-xs font-bold flex items-center gap-1"
                  >
                    {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {isTimerRunning ? 'PAUSE' : 'START'}
                  </button>
                  <button
                    onClick={() => {
                      setIsTimerRunning(false)
                      setTimeLeft(60 * 60)
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-[10px]"
                    title="Reset Exam Timer"
                  >
                    RESET
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Col: 5 Questions Navigator (4 cols) */}
              <div className="lg:col-span-4 space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between pb-1">
                  <span>Exam Questions (1 to 5)</span>
                  <span className="text-[10px] text-indigo-600 font-mono font-bold">
                    {Object.keys(evaluations).length}/5 Evaluated
                  </span>
                </div>

                {examPrompts.map((prompt, idx) => {
                  const isSelected = activeQuestionIdx === idx
                  const hasAnswer = (answers[prompt.id] || '').trim().length > 0
                  const hasEval = Boolean(evaluations[prompt.id])

                  return (
                    <button
                      key={prompt.id}
                      onClick={() => setActiveQuestionIdx(idx)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono text-indigo-700 uppercase">
                          QUESTION #{idx + 1}
                        </span>
                        {hasEval ? (
                          <span className="rounded bg-emerald-100 text-emerald-800 text-[9px] font-mono px-1.5 py-0.5 font-bold">
                            {evaluations[prompt.id].quality_score + evaluations[prompt.id].uniqueness_score}/200 PTS
                          </span>
                        ) : hasAnswer ? (
                          <span className="rounded bg-amber-100 text-amber-800 text-[9px] font-mono px-1.5 py-0.5 font-bold">
                            DRAFTED
                          </span>
                        ) : (
                          <span className="rounded bg-slate-100 text-slate-500 text-[9px] font-mono px-1.5 py-0.5 font-bold">
                            UNANSWERED
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-extrabold text-slate-900 mt-1.5 line-clamp-1">{prompt.title}</div>
                      <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{prompt.promptText}</div>
                      <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                        <span>~{prompt.suggestedWords} words</span>
                        <span>⏱️ {prompt.timeMinutes}m target</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Right Col: Active Question Workspace & Live Evaluation (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {activePrompt && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5 shadow-sm">
                    <div className="space-y-1.5 border-b border-slate-100 pb-4">
                      <div className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest">
                        QUESTION {activeQuestionIdx + 1} OF 5 • {FIELD_LABELS[activePrompt.field]}
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900">{activePrompt.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed pt-1">{activePrompt.promptText}</p>
                    </div>

                    {/* Answer Textarea */}
                    <div className="relative">
                      <textarea
                        rows={11}
                        value={answers[activePrompt.id] || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setAnswers((prev) => ({ ...prev, [activePrompt.id]: val }))
                          if (!isTimerRunning && val.length === 1) setIsTimerRunning(true)
                        }}
                        placeholder="Write your comprehensive analysis response here... Include definitions, real-world case examples, and edge-case boundary conditions."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-600 font-mono leading-relaxed"
                      />
                    </div>

                    {/* Word count & Submit Current Question */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {currentAnswer.trim().split(/\s+/).filter(Boolean).length} words / ~{activePrompt.suggestedWords} suggested
                        <span className="ml-2 text-emerald-700 font-bold">• Max 200 PTS</span>
                      </span>

                      <button
                        onClick={handleEvaluateCurrent}
                        disabled={evaluatingQuestionId === activePrompt.id || !currentAnswer.trim()}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                      >
                        {evaluatingQuestionId === activePrompt.id ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> GRADING RESPONSE...</>
                        ) : (
                          <><Send className="h-4 w-4" /> SUBMIT QUESTION #{activeQuestionIdx + 1}</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Individual Question Evaluation Card */}
                {currentEval && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8 space-y-5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-widest">
                        QUESTION #{activeQuestionIdx + 1} EVALUATION REPORT
                      </span>
                      <div className="text-xl font-extrabold font-mono text-emerald-950">
                        {currentEval.quality_score + currentEval.uniqueness_score}
                        <span className="text-xs text-emerald-700">/200 PTS</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                      <div className="rounded-xl border border-emerald-100 bg-white p-3 shadow-2xs">
                        <span className="text-slate-500">Quality Score:</span>{' '}
                        <strong className="text-indigo-700">{currentEval.quality_score}/100</strong>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-white p-3 shadow-2xs">
                        <span className="text-slate-500">Originality / Uniqueness:</span>{' '}
                        <strong className="text-amber-700">{currentEval.uniqueness_score}/100</strong>
                      </div>
                    </div>

                    {currentEval.feedback && (
                      <div className="text-xs text-slate-800 leading-relaxed bg-white p-4 rounded-xl border border-emerald-100 font-mono">
                        <strong className="text-emerald-800 block mb-1">Examiner Assessment:</strong>
                        {currentEval.feedback}
                      </div>
                    )}

                    {/* Strengths & Improvements */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                      {currentEval.strengths?.length > 0 && (
                        <div className="space-y-1.5">
                          <strong className="block text-emerald-800 font-semibold">Strengths</strong>
                          <ul className="space-y-1">
                            {currentEval.strengths.map((st: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5 text-slate-700">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{st}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {currentEval.improvements?.length > 0 && (
                        <div className="space-y-1.5">
                          <strong className="block text-amber-800 font-semibold">Areas for Growth</strong>
                          <ul className="space-y-1">
                            {currentEval.improvements.map((imp: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5 text-slate-700">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>{imp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
