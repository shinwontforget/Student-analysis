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
} from 'lucide-react'
import PremiumUpsellCard from '@/components/PremiumUpsellCard'

interface ChallengePrompt {
  id: string
  title: string
  subject: string
  promptText: string
  suggestedWords: number
}

const CHALLENGES: ChallengePrompt[] = [
  {
    id: 'ch_1',
    title: 'Monolithic vs. Microservices Trade-offs',
    subject: 'Software Architecture',
    promptText:
      'Analyze the core trade-offs between a Monolithic architecture and a Microservices architecture for a high-concurrency e-commerce application. Discuss network latency, data consistency (CAP theorem), and operational deployment complexity.',
    suggestedWords: 250,
  },
  {
    id: 'ch_2',
    title: 'Ethical Implications of Autonomous AI',
    subject: 'AI & Society',
    promptText:
      'Evaluate the ethical and accountability challenges when deploying autonomous AI systems in medical diagnostics. Who bears legal liability in cases of misdiagnosis, and how can algorithmic bias be mitigated?',
    suggestedWords: 300,
  },
  {
    id: 'ch_3',
    title: 'CPU Scheduling & Thread Synchronization',
    subject: 'Operating Systems',
    promptText:
      'Explain how Priority Inversion occurs in real-time operating systems and how Priority Inheritance Protocol resolves it. Contrast this with semaphore deadlock prevention.',
    suggestedWords: 200,
  },
]

export default function EssayModePage() {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengePrompt>(CHALLENGES[0])
  const [answerText, setAnswerText] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [evaluationResult, setEvaluationResult] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Status checks for Essay Mode unlock
  const [userProfile, setUserProfile] = useState<{
    id: string
    cgpa: number
    is_premium: boolean
  }>({ id: 'local_user', cgpa: 7.1, is_premium: false })

  const [unlockedEssayMode, setUnlockedEssayMode] = useState<boolean>(false)
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true)

  const checkStatus = async () => {
    setLoadingStatus(true)
    try {
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'calculate-gpa', quizScore: 85 }),
      })
      const data = await res.json()
      if (res.ok) {
        setUserProfile({
          id: data.user_id || 'user_demo',
          cgpa: data.cgpa ?? 7.1,
          is_premium: data.is_premium ?? false,
        })
        const unlocked =
          data.gpa_calculation?.unlocked_essay_mode ?? (data.cgpa >= 7.5 || data.is_premium)
        setUnlockedEssayMode(unlocked)
      }
    } catch {
      setUnlockedEssayMode(userProfile.cgpa >= 7.5 || userProfile.is_premium)
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const handleSubmitEssay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!answerText.trim()) return

    setLoading(true)
    setErrorMessage(null)
    setEvaluationResult(null)

    try {
      const res = await fetch('/api/evaluate-thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: selectedChallenge.id,
          prompt: selectedChallenge.promptText,
          answerText: answerText.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Evaluation failed')
      }

      setEvaluationResult(data.evaluation)
    } catch (err: any) {
      setErrorMessage(err.message || 'Error evaluating essay submission.')
    } finally {
      setLoading(false)
    }
  }

  const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Phase 5 Feature
            </span>
            <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] text-indigo-300 border border-indigo-500/30">
              Gemini AI Evaluator
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-indigo-400" /> Essay Writing & Critical Thinking Mode
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Write long-form analytical responses and receive real-time Gemini AI scoring & structured feedback.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`rounded-xl border px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 ${
              unlockedEssayMode
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
            }`}
          >
            {unlockedEssayMode ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Essay Mode Unlocked
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-rose-400" /> Locked (CGPA &lt; 7.5)
              </>
            )}
          </div>
        </div>
      </div>

      {/* LOCKED ESSAY MODE UPSELL CARD */}
      {!loadingStatus && !unlockedEssayMode && (
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs text-rose-300 flex items-center gap-3">
            <Lock className="h-5 w-5 shrink-0" />
            <div>
              <strong className="block text-white text-sm">Essay Mode Access Restricted</strong>
              Standard tier requires a minimum CGPA of 7.5 to unlock Essay Mode. Upgrade to Premium to instantly bypass limits!
            </div>
          </div>

          <PremiumUpsellCard
            cgpa={userProfile.cgpa}
            userId={userProfile.id}
            onSubscriptionSuccess={checkStatus}
          />
        </div>
      )}

      {/* UNLOCKED ESSAY MODE INTERFACE */}
      {unlockedEssayMode && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Challenge Selector & Submission Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Prompt Selector */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-6 backdrop-blur-xl space-y-4">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Select Critical Thinking Prompt
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CHALLENGES.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setSelectedChallenge(ch)
                      setEvaluationResult(null)
                    }}
                    className={`text-left rounded-xl border p-3.5 transition-all ${
                      selectedChallenge.id === ch.id
                        ? 'border-indigo-500 bg-indigo-600/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                        : 'border-white/10 bg-zinc-950/60 hover:border-white/20'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">
                      {ch.subject}
                    </span>
                    <h4 className="font-semibold text-white text-xs line-clamp-2">{ch.title}</h4>
                  </button>
                ))}
              </div>

              {/* Active Prompt Text */}
              <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
                <h4 className="text-sm font-semibold text-white mb-1">{selectedChallenge.title}</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">{selectedChallenge.promptText}</p>
                <span className="text-[10px] text-zinc-500 mt-2 block">
                  Target: ~{selectedChallenge.suggestedWords} words
                </span>
              </div>
            </div>

            {/* Essay Input Form */}
            <form onSubmit={handleSubmitEssay} className="rounded-2xl border border-white/10 bg-zinc-900/70 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-400" /> Write Response
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {wordCount} words | {answerText.length} / 3000 chars
                </span>
              </div>

              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your critical analysis response here..."
                rows={10}
                className="w-full rounded-xl bg-zinc-950 border border-white/10 p-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
                required
              />

              {errorMessage && (
                <div className="rounded-lg bg-rose-500/20 border border-rose-500/40 p-3 text-xs text-rose-300">
                  ⚠️ {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !answerText.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Gemini AI Evaluating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Evaluate Submission with Gemini AI
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Gemini AI Evaluation Dashboard Output (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-zinc-900/70 p-6 backdrop-blur-xl space-y-5">
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" /> AI Evaluation Report
              </h3>
              <p className="text-xs text-zinc-400">
                Structured feedback, score breakdown, and improvement tips.
              </p>
            </div>

            {!evaluationResult && !loading && (
              <div className="flex flex-col items-center justify-center h-64 text-center text-zinc-500 space-y-3">
                <BookOpen className="h-10 w-10 text-zinc-600" />
                <p className="text-xs max-w-xs">
                  Submit your written essay response to receive instant Gemini AI scoring & detailed breakdown.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-3 text-indigo-400">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-xs font-semibold text-zinc-300">
                  Analyzing arguments against prompt requirements...
                </p>
              </div>
            )}

            {evaluationResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5 text-xs"
              >
                {/* Score Banner */}
                <div className="rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-300">
                      Evaluated Score
                    </span>
                    <div className="text-3xl font-extrabold text-white">
                      {evaluationResult.score} <span className="text-sm font-normal text-zinc-400">/ 10.0</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold">
                    <Award className="h-6 w-6" />
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <strong className="block text-zinc-200 mb-1 font-semibold">Constructive Feedback</strong>
                  <p className="text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-white/10 leading-relaxed">
                    {evaluationResult.feedback}
                  </p>
                </div>

                {/* Strengths */}
                {evaluationResult.strengths?.length > 0 && (
                  <div>
                    <strong className="block text-emerald-400 mb-1 font-semibold">Key Strengths</strong>
                    <ul className="space-y-1">
                      {evaluationResult.strengths.map((str: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5 text-zinc-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {evaluationResult.improvements?.length > 0 && (
                  <div>
                    <strong className="block text-amber-400 mb-1 font-semibold">Areas for Growth</strong>
                    <ul className="space-y-1">
                      {evaluationResult.improvements.map((imp: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5 text-zinc-300">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
