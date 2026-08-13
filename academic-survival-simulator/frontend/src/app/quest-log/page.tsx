'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Zap,
  CheckCircle2,
  AlertCircle,
  Award,
  BookOpen,
  RefreshCw,
  Send,
  Loader2,
  ChevronRight,
  Sparkles,
  Trophy,
  HelpCircle,
  FileText,
  Check,
  BookPlus,
  CheckSquare,
  Square,
  Crown,
  Lock,
  Clock,
  Timer,
  Play,
  Pause,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/Toast'
import {
  EXAM_PROMPTS,
  FIELD_LABELS,
  LEVEL_LABELS,
  getPromptsForUser,
  ExamPrompt,
  StudentLevel,
  StudentField,
} from '@/data/essay-challenges'

interface OptionDetail {
  text: string
  explanation: string
}

interface Question {
  id: string
  question: string
  subject: string
  difficulty: string
  options: {
    A: OptionDetail
    B: OptionDetail
    C: OptionDetail
    D: OptionDetail
  }
  correctAnswer: 'A' | 'B' | 'C' | 'D'
}

interface ShelfItem {
  id: string
  title: string
  subject: string
  quizzedToday: boolean
}

export default function QuestLogPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'quiz' | 'critical'>('quiz')
  const [quizMode, setQuizMode] = useState<'mcq' | 'long'>('mcq')

  // User Profile State
  const [userProfile, setUserProfile] = useState<{
    id: string
    full_name: string
    cgpa: number
    is_premium: boolean
    student_level: StudentLevel
    student_field: StudentField
  } | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // Revision Shelf State
  const [shelfItems, setShelfItems] = useState<ShelfItem[]>([])
  const [loadingShelf, setLoadingShelf] = useState(true)
  const [selectedShelfIds, setSelectedShelfIds] = useState<string[]>([])
  const [showShelfSelector, setShowShelfSelector] = useState(false)

  // Quiz State
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({})
  const [generatingQuiz, setGeneratingQuiz] = useState(false)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [lastQuizResult, setLastQuizResult] = useState<{
    scorePct: number
    cgpaDelta: number
    newCgpa: number
  } | null>(null)

  // Subjective Written Exam State
  const [availablePrompts, setAvailablePrompts] = useState<ExamPrompt[]>(EXAM_PROMPTS.slice(0, 3))
  const [selectedChallenge, setSelectedChallenge] = useState<ExamPrompt>(EXAM_PROMPTS[0])
  const [essayResponse, setEssayResponse] = useState('')
  const [evaluatingEssay, setEvaluatingEssay] = useState(false)
  const [essayResult, setEssayResult] = useState<any>(null)

  // Long Answer Quiz State (Revision Shelf based, locked)
  const [longAnswerTopic, setLongAnswerTopic] = useState<ShelfItem | null>(null)
  const [longAnswerResponse, setLongAnswerResponse] = useState('')
  const [evaluatingLong, setEvaluatingLong] = useState(false)
  const [longAnswerResult, setLongAnswerResult] = useState<any>(null)

  // Exam Timer State (in seconds)
  const [timeLeft, setTimeLeft] = useState<number>(20 * 60)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)

  // Fetch current user
  useEffect(() => {
    async function loadUser() {
      setLoadingUser(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, full_name, cgpa, is_premium, student_level, student_field')
          .eq('id', user.id)
          .single()

        if (profile) {
          const lvl = (profile.student_level as StudentLevel) || 'college'
          const fld = (profile.student_field as StudentField) || 'computer_science'
          setUserProfile({
            id: profile.id,
            full_name: profile.full_name || 'Scholar',
            cgpa: Number(profile.cgpa) || 3.0,
            is_premium: profile.is_premium || false,
            student_level: lvl,
            student_field: fld,
          })

          const prompts = getPromptsForUser(fld, lvl)
          if (prompts.length > 0) {
            // Select 2 daily questions deterministically using today's date
            const todayStr = new Date().toISOString().split('T')[0]
            let seed = 0
            for (let i = 0; i < todayStr.length; i++) seed += todayStr.charCodeAt(i)
            const idx1 = seed % prompts.length
            const idx2 = (seed + 3) % prompts.length
            const dailyPrompts = Array.from(new Set([prompts[idx1], prompts[idx2]]))
            const final2Prompts = dailyPrompts.length >= 2 ? dailyPrompts.slice(0, 2) : prompts.slice(0, Math.min(2, prompts.length))
            setAvailablePrompts(final2Prompts)
            setSelectedChallenge(final2Prompts[0])
          }
        }
      }
      setLoadingUser(false)
    }
    loadUser()
  }, [])

  // Fetch shelf items with today's quiz status
  useEffect(() => {
    if (!userProfile?.id) return
    async function loadShelf() {
      setLoadingShelf(true)
      const todayStr = new Date().toISOString().split('T')[0]

      const { data: shelf } = await supabase
        .from('revision_shelf')
        .select('id, title, subject')
        .eq('user_id', userProfile!.id)
        .order('created_at', { ascending: false })

      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('subject')
        .eq('user_id', userProfile!.id)
        .gte('taken_at', todayStr + 'T00:00:00')

      const quizzedSubjects = new Set((attempts || []).map((a: any) => a.subject?.toUpperCase()))

      const items: ShelfItem[] = (shelf || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        subject: s.subject,
        quizzedToday: quizzedSubjects.has(s.title?.toUpperCase()),
      }))

      setShelfItems(items)

      // Auto-select un-quizzed items for the next quiz
      const unquizzed = items.filter((i) => !i.quizzedToday).map((i) => i.id)
      setSelectedShelfIds(unquizzed.length > 0 ? unquizzed : items.map((i) => i.id))

      setLoadingShelf(false)
    }
    loadShelf()
  }, [userProfile?.id])

  const handleGenerateQuiz = async () => {
    // If shelf is loaded and empty, do not generate random quiz
    if (!loadingShelf && shelfItems.length === 0) {
      toast('Your Revision Shelf is empty. Add topics to generate a quiz!', 'info')
      return
    }

    setGeneratingQuiz(true)
    try {
      let topics: string[] = []

      // Priority 1: URL search parameter (e.g. from Revision Shelf "LAUNCH QUIZ" button)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const paramTopics = urlParams.get('topics')
        if (paramTopics) {
          topics = paramTopics.split(',').map((t) => t.trim()).filter(Boolean)
        }
      }

      // Priority 2: localStorage override
      if (topics.length === 0 && typeof window !== 'undefined') {
        const storedSelected = localStorage.getItem('quiz_selected_topics')
        if (storedSelected) {
          try {
            const parsed = JSON.parse(storedSelected)
            if (Array.isArray(parsed) && parsed.length > 0) {
              topics = parsed
              localStorage.removeItem('quiz_selected_topics')
            }
          } catch { /* ignore */ }
        }
      }

      // Priority 3: User-selected shelf items
      if (topics.length === 0 && selectedShelfIds.length > 0 && shelfItems.length > 0) {
        topics = shelfItems
          .filter((i) => selectedShelfIds.includes(i.id))
          .map((i) => i.title)
      }

      // Priority 4: All shelf items
      if (topics.length === 0 && userProfile?.id) {
        const { data: shelf } = await supabase
          .from('revision_shelf')
          .select('title')
          .eq('user_id', userProfile.id)
          .limit(5)
        if (shelf && shelf.length > 0) {
          topics = shelf.map((s: any) => s.title)
        }
      }

      if (topics.length === 0) {
        toast('No topics available on your Revision Shelf. Add topics first!', 'info')
        setGeneratingQuiz(false)
        return
      }

      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics,
          numQuestions: 10,
        }),
      })

      const data = await res.json()
      if (res.ok && data.questions) {
        setQuestions(data.questions)
        setCurrentQIndex(0)
        setSelectedAnswers({})
        setLastQuizResult(null)
        setShowShelfSelector(false)
      } else {
        toast(data.error || 'Failed to generate quiz', 'error')
      }
    } catch (err: any) {
      toast('Failed to load quiz questions', 'error')
    } finally {
      setGeneratingQuiz(false)
    }
  }

  const handleSelectOption = (optKey: 'A' | 'B' | 'C' | 'D') => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQIndex]: optKey,
    }))
  }

  const handleNextQuestion = async () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1)
    } else {
      setSubmittingQuiz(true)
      let correctCount = 0
      questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctAnswer) correctCount += 1
      })

      try {
        const res = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: questions[0]?.subject || 'General Knowledge',
            correctAnswers: correctCount,
            totalQuestions: questions.length,
          }),
        })

        const data = await res.json()
        if (res.ok) {
          setLastQuizResult({
            scorePct: data.scorePct,
            cgpaDelta: data.cgpaDelta,
            newCgpa: data.currentCgpa ?? (userProfile?.cgpa ?? 3.0),
          })
          toast(`Quiz Complete! Score: ${data.scorePct}% (${data.cgpaDelta >= 0 ? '+' : ''}${data.cgpaDelta} CGPA delta queued for end-of-day rollup)`, 'success')

          // Refresh shelf quiz status
          setShelfItems((prev) =>
            prev.map((item) =>
              selectedShelfIds.includes(item.id) ? { ...item, quizzedToday: true } : item
            )
          )
        } else {
          toast(data.error || 'Quiz submission failed', 'error')
        }
      } catch {
        toast('Quiz submission error', 'error')
      } finally {
        setSubmittingQuiz(false)
      }
    }
  }

  const handleEvaluateEssay = async () => {
    if (!essayResponse.trim()) {
      toast('Please write your response before submitting.', 'error')
      return
    }

    setEvaluatingEssay(true)
    setEssayResult(null)

    try {
      const res = await fetch('/api/evaluate-thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: selectedChallenge.id,
          promptText: selectedChallenge.promptText,
          answerText: essayResponse,
          fullEval: isEssayUnlocked,
        }),
      })

      const data = await res.json()
      const evalData = data.evaluation || data.data
      if (res.ok && evalData) {
        setEssayResult({ ...evalData, fullEval: isEssayUnlocked })
        const total = (evalData.quality_score || 0) + (evalData.uniqueness_score || 0)
        toast(`Critical Thinking Evaluated! Score: ${total}/200`, 'success')
      } else {
        toast(data.error || 'Evaluation failed.', 'error')
      }
    } catch {
      toast('Error submitting essay.', 'error')
    } finally {
      setEvaluatingEssay(false)
    }
  }

  const userCgpa = userProfile?.cgpa ?? 3.0
  const isPremium = userProfile?.is_premium ?? false
  const isEssayUnlocked = userCgpa >= 7.5 || isPremium

  const currentQ = questions[currentQIndex]
  const progressPct = questions.length > 0 ? Math.round(((currentQIndex + 1) / questions.length) * 100) : 0

  const quizzedCount = shelfItems.filter((i) => i.quizzedToday).length
  const unquizzedCount = shelfItems.filter((i) => !i.quizzedToday).length

  // Timer effect
  useEffect(() => {
    let interval: any = null
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false)
      toast('⏰ Time is up for your written exam session!', 'info')
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timeLeft])

  // Reset timer on challenge change
  useEffect(() => {
    const baseMins = isEssayUnlocked ? 30 : 20
    setTimeLeft(baseMins * 60)
    setIsTimerRunning(false)
  }, [selectedChallenge?.id, isEssayUnlocked])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <main className="min-h-screen bg-[#070712] text-zinc-100 font-mono select-none p-4 sm:p-8">
      {/* Container */}
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
          <span>DAILY OBJECTIVES</span>
          <span>›</span>
          <span className="text-violet-400">QUEST LOG</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              KNOWLEDGE EXTRACTION PROTOCOL
            </h1>
            <p className="text-xs text-zinc-400 font-sans mt-1">
              Quizzes &amp; Subjective Written Exams are the only ways to build your CGPA.
              {userProfile && (
                <span className="ml-2 text-emerald-400 font-mono">
                  [{LEVEL_LABELS[userProfile.student_level]} · {FIELD_LABELS[userProfile.student_field]}]
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowShelfSelector((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-950/40 px-4 py-2 text-xs font-bold uppercase text-violet-300 hover:bg-violet-900/50 transition-all self-start sm:self-auto"
          >
            <BookOpen className="h-3.5 w-3.5" /> SELECT TOPICS
          </button>
        </div>

        {/* Revision Shelf Status Bar */}
        {!loadingShelf && shelfItems.length === 0 ? (
          <div className="flex items-start gap-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 px-5 py-4">
            <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-black uppercase tracking-wider text-amber-300">No topics on your Revision Shelf!</div>
              <div className="text-[11px] text-zinc-400 font-sans mt-0.5">Add material to your Revision Shelf first — quizzes are generated from your saved topics. Your CGPA only grows through quizzes!</div>
            </div>
            <Link
              href="/revision-shelf"
              className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-all shrink-0 uppercase tracking-wider"
            >
              <BookPlus className="h-3.5 w-3.5" /> ADD TOPICS
            </Link>
          </div>
        ) : !loadingShelf && shelfItems.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#0d0c1d] px-5 py-3">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Today's Progress:</div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> {quizzedCount} quizzed
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
              <HelpCircle className="h-3.5 w-3.5" /> {unquizzedCount} remaining
            </div>
            <button
              onClick={handleGenerateQuiz}
              disabled={generatingQuiz}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-violet-600/20 border border-violet-500/30 px-3 py-1.5 text-xs font-bold uppercase text-violet-300 hover:bg-violet-600/40 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`h-3 w-3 ${generatingQuiz ? 'animate-spin' : ''}`} />
              {generatingQuiz ? 'GENERATING...' : 'NEW QUIZ SESSION'}
            </button>
          </div>
        ) : null}

        {/* Shelf Topic Selector Dropdown */}
        <AnimatePresence>
          {showShelfSelector && shelfItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-3xl border border-violet-500/20 bg-[#0d0c1d] p-5 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-violet-400">
                  SELECT TOPICS TO QUIZ FROM
                </div>
                <div className="text-[10px] text-zinc-500">
                  {selectedShelfIds.length}/{shelfItems.length} selected
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {shelfItems.map((item) => {
                  const isSelected = selectedShelfIds.includes(item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() =>
                        setSelectedShelfIds((prev) =>
                          prev.includes(item.id)
                            ? prev.filter((id) => id !== item.id)
                            : [...prev, item.id]
                        )
                      }
                      className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                        isSelected
                          ? 'border-violet-500 bg-violet-950/40 text-white'
                          : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-violet-400 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-zinc-600 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{item.title}</div>
                        <div className="text-[10px] text-zinc-500">{item.subject}</div>
                      </div>
                      {item.quizzedToday && (
                        <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 uppercase shrink-0">
                          Done ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={handleGenerateQuiz}
                disabled={generatingQuiz || selectedShelfIds.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 disabled:opacity-50 transition-all"
              >
                {generatingQuiz ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
                {generatingQuiz ? 'GENERATING QUIZ...' : `GENERATE QUIZ FROM ${selectedShelfIds.length} TOPIC(S)`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Toggle: DAILY QUIZ | CRITICAL SECTION */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-1">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'quiz'
                ? 'border-violet-500 text-violet-300 bg-violet-500/10 rounded-t-xl'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Zap className="h-4 w-4" /> DAILY QUIZ
          </button>

          <button
            onClick={() => setActiveTab('critical')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'critical'
                ? 'border-pink-500 text-pink-300 bg-pink-500/10 rounded-t-xl'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Brain className="h-4 w-4 text-pink-400" /> CRITICAL SECTION
            <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold px-2 py-0.5 uppercase border border-emerald-500/30">
              2 DAILY QUESTIONS (200 PTS MAX)
            </span>
          </button>
        </div>

        {/* TAB 1: DAILY QUIZ */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            {/* MCQ / Long Answer Mode Toggle */}
            <div className="flex items-center gap-2 p-1 bg-[#0d0c1d] border border-white/10 rounded-2xl w-fit">
              <button
                onClick={() => setQuizMode('mcq')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  quizMode === 'mcq'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Zap className="h-3.5 w-3.5" /> MCQ QUIZ
              </button>
              <button
                onClick={() => setQuizMode('long')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  quizMode === 'long'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> LONG ANSWER
                {!isEssayUnlocked && (
                  <span className="flex items-center gap-1 rounded-full bg-rose-500/20 text-rose-300 text-[9px] font-extrabold px-2 py-0.5 uppercase border border-rose-500/30">
                    <Lock className="h-2.5 w-2.5" /> LOCKED
                  </span>
                )}
                {isEssayUnlocked && (
                  <span className="rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-extrabold px-2 py-0.5 uppercase border border-amber-500/30">
                    PREMIUM
                  </span>
                )}
              </button>
            </div>

            {/* LONG ANSWER MODE (locked or unlocked) */}
            {quizMode === 'long' && !isEssayUnlocked && (
              <div className="rounded-3xl border border-rose-500/30 bg-[#0d0c1d] p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-500/5 via-transparent to-transparent" />
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-rose-500/40 bg-rose-500/10 text-rose-400 mx-auto shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                  <Lock className="h-10 w-10" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <span className="rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold px-3 py-1 uppercase border border-rose-500/40 tracking-widest">
                    RESTRICTED ACCESS PROTOCOL
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wider">
                    LONG ANSWER IS LOCKED
                  </h2>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    Long-answer questions are generated from your <strong className="text-violet-300 font-mono">Revision Shelf topics</strong> and require a written response evaluated by AI. Unlock at <strong className="text-amber-300 font-mono">CGPA ≥ 7.50</strong> or with <strong className="text-violet-400 font-mono">Premium Pass</strong>.
                  </p>
                </div>
                <div className="max-w-xs mx-auto rounded-2xl border border-white/10 bg-[#070712] p-4 space-y-2 font-mono">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-zinc-500">YOUR CURRENT CGPA</span>
                    <span className="text-amber-400">{userCgpa.toFixed(2)} / 7.50</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, (userCgpa / 7.5) * 100))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-500 text-right">
                    {(7.5 - userCgpa) > 0 ? `+${(7.5 - userCgpa).toFixed(2)} CGPA needed to unlock` : 'Condition Met!'}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setQuizMode('mcq')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-all"
                  >
                    <Zap className="h-4 w-4 fill-current" /> DO MCQ QUIZ INSTEAD
                  </button>
                  <Link
                    href="/premium"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-6 py-3 text-xs font-black uppercase tracking-widest text-amber-300 hover:bg-amber-500/20 transition-all"
                  >
                    <Crown className="h-4 w-4 text-amber-400" /> UNLOCK WITH PREMIUM PASS
                  </Link>
                </div>
              </div>
            )}

            {/* LONG ANSWER MODE (unlocked) */}
            {quizMode === 'long' && isEssayUnlocked && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 px-5 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300">
                      <FileText className="h-4 w-4 text-amber-400" /> LONG ANSWER — REVISION SHELF TOPIC
                    </div>
                    <div className="text-[11px] text-zinc-400 font-sans">
                      Select a topic from your Revision Shelf and write a detailed response. Evaluated by AI for depth &amp; accuracy.
                    </div>
                  </div>
                </div>
                {shelfItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-3xl border border-amber-500/30 bg-[#0d0c1d] space-y-4">
                    <AlertCircle className="h-8 w-8 text-amber-400" />
                    <p className="text-xs text-zinc-400 font-sans">Your Revision Shelf is empty. Add topics to enable Long Answer mode.</p>
                    <Link href="/revision-shelf" className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-5 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-all uppercase tracking-wider">
                      <BookPlus className="h-4 w-4" /> ADD TOPICS TO SHELF
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Select Shelf Topic</div>
                      {shelfItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => { setLongAnswerTopic(item); setLongAnswerResponse(''); setLongAnswerResult(null) }}
                          className={`w-full text-left p-4 rounded-2xl border transition-all font-sans ${
                            longAnswerTopic?.id === item.id
                              ? 'border-amber-500 bg-amber-950/30 text-white shadow-lg'
                              : 'border-white/10 bg-[#0d0c1d] text-zinc-400 hover:border-white/20'
                          }`}
                        >
                          <div className="text-xs font-extrabold text-white">{item.title}</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">{item.subject}</div>
                          {item.quizzedToday && <span className="mt-1 inline-block rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 uppercase">Quizzed today</span>}
                        </button>
                      ))}
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                      {longAnswerTopic ? (
                        <div className="rounded-3xl border border-white/10 bg-[#0d0c1d] p-6 space-y-4">
                          <div className="space-y-1 border-b border-white/10 pb-4">
                            <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">LONG ANSWER QUESTION</div>
                            <h3 className="text-base font-extrabold text-white font-sans">Explain the key concepts and real-world applications of: <span className="text-amber-300">{longAnswerTopic.title}</span></h3>
                            <p className="text-xs text-zinc-400 font-sans pt-1">Write a comprehensive, well-structured response demonstrating your understanding. Include definitions, examples, and applications.</p>
                          </div>
                          <textarea
                            rows={9}
                            value={longAnswerResponse}
                            onChange={(e) => setLongAnswerResponse(e.target.value)}
                            placeholder={`Write your detailed answer about ${longAnswerTopic.title}...`}
                            className="w-full rounded-2xl border border-white/10 bg-[#070712] p-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono leading-relaxed"
                          />
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {longAnswerResponse.trim().split(/\s+/).filter(Boolean).length} words
                              <span className="ml-2 text-amber-400">• Evaluated for Depth &amp; Accuracy</span>
                            </span>
                            <button
                              onClick={async () => {
                                if (!longAnswerTopic || !longAnswerResponse.trim()) return
                                setEvaluatingLong(true)
                                setLongAnswerResult(null)
                                try {
                                  const res = await fetch('/api/evaluate-thinking', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      challengeId: longAnswerTopic.id,
                                      promptText: `Explain the key concepts and real-world applications of: ${longAnswerTopic.title}`,
                                      answerText: longAnswerResponse,
                                      fullEval: true,
                                    }),
                                  })
                                  const data = await res.json()
                                  if (res.ok && data.success) {
                                    setLongAnswerResult(data.data)
                                    toast(`Evaluated! Score: ${data.data.quality_score + data.data.uniqueness_score}/200`, 'success')
                                  } else {
                                    toast(data.error || 'Evaluation failed.', 'error')
                                  }
                                } catch { toast('Error submitting response.', 'error') }
                                finally { setEvaluatingLong(false) }
                              }}
                              disabled={evaluatingLong || !longAnswerResponse.trim()}
                              className="flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-amber-600/30 hover:bg-amber-500 disabled:opacity-50 transition-all"
                            >
                              {evaluatingLong ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> EVALUATING...</>
                              ) : (
                                <><Send className="h-4 w-4" /> SUBMIT ANSWER</>
                              )}
                            </button>
                          </div>
                          {longAnswerResult && (
                            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-6 space-y-4 font-sans">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">EVALUATION COMPLETED</span>
                                <div className="text-lg font-black font-mono text-white">
                                  {longAnswerResult.quality_score + longAnswerResult.uniqueness_score}<span className="text-xs text-zinc-400">/200 PTS</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                  <span className="text-zinc-400">Depth/Quality:</span>{' '}
                                  <strong className="text-violet-300">{longAnswerResult.quality_score}/100</strong>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                  <span className="text-zinc-400">Accuracy/Insight:</span>{' '}
                                  <strong className="text-amber-300">{longAnswerResult.uniqueness_score}/100</strong>
                                </div>
                              </div>
                              {longAnswerResult.feedback && (
                                <div className="text-xs text-zinc-200 leading-relaxed bg-[#070712]/50 p-4 rounded-xl border border-white/10 font-mono">
                                  {longAnswerResult.feedback}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-16 rounded-3xl border border-white/10 bg-[#0d0c1d] text-xs text-zinc-500 font-mono">
                          ← Select a topic from your shelf to begin
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MCQ QUIZ SECTION */}
            {quizMode === 'mcq' && (
              generatingQuiz ? (
              <div className="flex flex-col items-center justify-center py-24 rounded-3xl border border-violet-500/30 bg-[#0d0c1d] space-y-4 shadow-2xl">
                <Loader2 className="h-12 w-12 animate-spin text-violet-400" />
                <p className="text-sm text-zinc-300 font-sans font-semibold animate-pulse">
                  AI is synthesizing 10 targeted assessment questions from your Revision Shelf modules...
                </p>
              </div>
            ) : questions.length > 0 && currentQ ? (
              <div className="rounded-3xl border border-violet-500/20 bg-[#0d0c1d] p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
                {/* Top Question Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-violet-400 uppercase tracking-widest">
                      Question {currentQIndex + 1} of {questions.length} (10-Question Session)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setQuestions([])
                        setCurrentQIndex(0)
                        setSelectedAnswers({})
                      }}
                      className="text-[11px] font-bold text-zinc-400 hover:text-white uppercase transition-colors"
                    >
                      🔄 Change Modules
                    </button>
                    <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                      <span className="text-xs font-bold text-zinc-400 font-mono">{progressPct}%</span>
                      <div className="h-2 w-28 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Prompt */}
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-violet-950/60 border border-violet-500/30 px-2.5 py-1 text-[10px] font-bold text-violet-300 uppercase tracking-wider">
                    {currentQ.subject} • {currentQ.difficulty}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-sans leading-relaxed">
                    {currentQ.question}
                  </h3>
                </div>

                {/* 4 Option Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                    const opt = currentQ.options[optKey]
                    const isSelected = selectedAnswers[currentQIndex] === optKey
                    return (
                      <button
                        key={optKey}
                        onClick={() => handleSelectOption(optKey)}
                        className={`text-left p-5 rounded-2xl border transition-all relative group flex flex-col justify-between ${
                          isSelected
                            ? 'border-violet-500 bg-violet-950/40 shadow-[0_0_20px_rgba(139,92,246,0.2)]'
                            : 'border-white/10 bg-[#070712] hover:border-violet-500/50 hover:bg-[#0f0e26]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">
                            OPTION {optKey}
                          </span>
                          <div
                            className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-violet-400 bg-violet-500 text-white' : 'border-zinc-600'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-white font-sans mb-1">{opt.text}</div>
                        <div className="text-xs text-zinc-400 font-sans leading-relaxed">{opt.explanation}</div>
                      </button>
                    )
                  })}
                </div>

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between border-t border-white/10 pt-6">
                  {lastQuizResult ? (
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">LAST SCORE</div>
                        <div className="text-lg font-black text-white">
                          {lastQuizResult.scorePct}<span className="text-xs text-zinc-400">/100</span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 text-xs font-bold text-emerald-300">
                        {lastQuizResult.cgpaDelta >= 0 ? '+' : ''}{lastQuizResult.cgpaDelta} CGPA
                      </div>
                      <span className="rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 uppercase">COMPLETED</span>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 font-sans">Select your answer to proceed.</div>
                  )}

                  <button
                    onClick={handleNextQuestion}
                    disabled={!selectedAnswers[currentQIndex] || submittingQuiz}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-7 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 disabled:opacity-50 transition-all"
                  >
                    {submittingQuiz ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : currentQIndex === questions.length - 1 ? (
                      'SUBMIT 10-QUESTION QUIZ'
                    ) : (
                      <>NEXT <ChevronRight className="h-4 w-4" /></>
                    )}
                  </button>
                </div>
              </div>
            ) : shelfItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-3xl border border-amber-500/30 bg-[#0d0c1d] space-y-4 shadow-2xl">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-400">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-base font-black uppercase text-amber-300 tracking-wider">
                    YOUR REVISION SHELF IS EMPTY
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    Targeted daily quizzes are generated strictly from your Revision Shelf topics. Add your subjects or notes to your shelf to start building your CGPA!
                  </p>
                </div>
                <Link
                  href="/revision-shelf"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-5 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-all uppercase tracking-wider shadow-lg shadow-amber-500/10"
                >
                  <BookPlus className="h-4 w-4" /> ADD TOPICS TO REVISION SHELF
                </Link>
              </div>
              ) : (
              /* Interactive Revision Shelf Module Selection Setup Screen */
              <div className="rounded-3xl border border-violet-500/30 bg-[#0d0c1d] p-6 sm:p-8 space-y-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-violet-400">
                      <BookOpen className="h-4 w-4" /> SELECT REVISION MODULES FOR YOUR 10-QUESTION QUIZ
                    </div>
                    <p className="text-xs text-zinc-400 font-sans">
                      Select which concepts from your Revision Shelf you want to test. Each quiz session generates exactly 10 comprehensive assessment questions.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        if (selectedShelfIds.length === shelfItems.length) {
                          setSelectedShelfIds([])
                        } else {
                          setSelectedShelfIds(shelfItems.map((i) => i.id))
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-[11px] font-bold text-zinc-300 hover:bg-white/10 transition-all uppercase"
                    >
                      {selectedShelfIds.length === shelfItems.length ? 'DESELECT ALL' : 'SELECT ALL'}
                    </button>
                    <Link
                      href="/revision-shelf"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-violet-500/30 bg-violet-950/40 text-[11px] font-bold text-violet-300 hover:bg-violet-900/40 transition-all uppercase"
                    >
                      <BookPlus className="h-3.5 w-3.5" /> ADD TOPICS
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {shelfItems.map((item) => {
                    const isSelected = selectedShelfIds.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        onClick={() =>
                          setSelectedShelfIds((prev) =>
                            prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                          )
                        }
                        className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all relative ${
                          isSelected
                            ? 'border-violet-500 bg-violet-950/40 text-white shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                            : 'border-white/10 bg-[#070712] text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate">{item.title}</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5 truncate">{item.subject}</div>
                          {item.quizzedToday ? (
                            <span className="mt-2 inline-block rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 uppercase">
                              Quizzed Today ✓
                            </span>
                          ) : (
                            <span className="mt-2 inline-block rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[9px] font-bold px-2 py-0.5 uppercase">
                              Ready to Quiz ⚡
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={handleGenerateQuiz}
                  disabled={generatingQuiz || selectedShelfIds.length === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  {generatingQuiz ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
                  {generatingQuiz ? 'GENERATING 10 QUESTIONS...' : `START 10-QUESTION QUIZ (${selectedShelfIds.length} MODULES SELECTED)`}
                </button>
              </div>
            )
            )}
          </div>
        )}

        {/* TAB 2: CRITICAL SECTION (UNLOCKED FOR ALL USERS) */}
        {activeTab === 'critical' && (
          <div className="space-y-6">
            {/* Access tier banner + Exam Timer */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-pink-500/30 bg-pink-950/20 px-5 py-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-pink-300">
                  <Brain className="h-4 w-4 text-pink-400" /> CRITICAL THINKING PROTOCOL (2 DAILY QUESTIONS)
                </div>
                <div className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Select one of today's 2 daily thinking challenges for {userProfile ? FIELD_LABELS[userProfile.student_field] : 'your field'}. Each response is evaluated for up to <strong className="text-emerald-300 font-mono">200 Points</strong> (100 Quality + 100 Creativeness) and feeds directly to Daily &amp; Monthly Leaderboards!
                </div>
              </div>

              {/* Countdown Timer Control Widget */}
              <div className="flex items-center gap-3 bg-[#070712] border border-white/10 rounded-xl px-4 py-2 self-stretch md:self-auto justify-between">
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${isTimerRunning ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}`} />
                  <span className={`text-lg font-black font-mono ${timeLeft < 180 ? 'text-rose-400' : 'text-white'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsTimerRunning((v) => !v)}
                    className="p-1.5 rounded-lg bg-pink-600/30 hover:bg-pink-600/50 text-pink-300 transition-colors text-xs font-bold flex items-center gap-1"
                  >
                    {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {isTimerRunning ? 'PAUSE' : 'START'}
                  </button>
                  <button
                    onClick={() => {
                      setIsTimerRunning(false)
                      setTimeLeft(30 * 60)
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors text-[10px]"
                    title="Reset Timer"
                  >
                    RESET
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 2 Daily Exam Questions Selector */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Today's 2 Daily Questions</span>
                  <span className="text-[10px] text-pink-400 font-mono">
                    {userProfile ? FIELD_LABELS[userProfile.student_field] : ''}
                  </span>
                </div>
                {availablePrompts.slice(0, 2).map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setSelectedChallenge(ch)
                      setEssayResult(null)
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all font-sans ${
                      selectedChallenge.id === ch.id
                        ? 'border-pink-500 bg-pink-950/30 text-white shadow-lg'
                        : 'border-white/10 bg-[#0d0c1d] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono text-pink-400 uppercase">
                        QUESTION #{idx + 1} • {FIELD_LABELS[ch.field] || ch.field}
                      </span>
                      <span className="rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono px-1.5 py-0.5 font-bold">
                        200 PTS MAX
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-white mt-1.5">{ch.title}</div>
                    <div className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{ch.promptText}</div>
                    <div className="mt-2 text-[10px] text-zinc-400 flex items-center justify-between font-mono">
                      <span>~{ch.suggestedWords} words</span>
                      <span>⏱️ {ch.timeMinutes}m</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Critical Thinking Response Textarea */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-3xl border border-white/10 bg-[#0d0c1d] p-6 space-y-4">
                  <div className="space-y-1 border-b border-white/10 pb-4">
                    <div className="text-[10px] font-mono font-bold text-pink-400 uppercase tracking-widest">
                      DAILY CHALLENGE • {FIELD_LABELS[selectedChallenge.field] || selectedChallenge.field}
                    </div>
                    <h3 className="text-base font-extrabold text-white font-sans">{selectedChallenge.title}</h3>
                    <p className="text-xs text-zinc-300 font-sans leading-relaxed pt-1">{selectedChallenge.promptText}</p>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={9}
                      value={essayResponse}
                      onChange={(e) => {
                        setEssayResponse(e.target.value)
                        if (!isTimerRunning && e.target.value.length === 1) {
                          setIsTimerRunning(true)
                        }
                      }}
                      placeholder="Write your critical thinking analysis here... (Evaluated for Quality 0-100 & Creativeness 0-100)"
                      className="w-full rounded-2xl border border-white/10 bg-[#070712] p-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 font-mono leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {essayResponse.trim().split(/\s+/).filter(Boolean).length} words / ~{selectedChallenge.suggestedWords} suggested
                      <span className="ml-2 text-emerald-400">• Max Score: 200 PTS</span>
                    </span>
                    <button
                      onClick={handleEvaluateEssay}
                      disabled={evaluatingEssay || !essayResponse.trim()}
                      className="flex items-center gap-2 rounded-xl bg-pink-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-pink-600/30 hover:bg-pink-500 disabled:opacity-50 transition-all"
                    >
                      {evaluatingEssay ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> EVALUATING THINKING...</>
                      ) : (
                        <><Send className="h-4 w-4" /> SUBMIT CRITICAL RESPONSE</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Evaluation Result */}
                {essayResult && (
                  <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-6 space-y-4 font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                        CRITICAL THINKING EVALUATION COMPLETED
                      </span>
                      <div className="text-lg font-black font-mono text-white">
                        {essayResult.quality_score + essayResult.uniqueness_score}
                        <span className="text-xs text-zinc-400">/200 PTS</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <span className="text-zinc-400">Quality Score:</span>{' '}
                        <strong className="text-violet-300">{essayResult.quality_score}/100</strong>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <span className="text-zinc-400">Creativeness/Uniqueness:</span>{' '}
                        <strong className="text-pink-300">{essayResult.uniqueness_score}/100</strong>
                      </div>
                    </div>

                    {essayResult.feedback && (
                      <div className="text-xs text-zinc-200 leading-relaxed bg-[#070712]/50 p-4 rounded-xl border border-white/10 font-mono">
                        {essayResult.feedback}
                      </div>
                    )}
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3 text-xs text-emerald-300 font-mono">
                      🏆 Your score ({essayResult.quality_score + essayResult.uniqueness_score} pts) has been posted to the Daily &amp; Monthly Leaderboards!
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
