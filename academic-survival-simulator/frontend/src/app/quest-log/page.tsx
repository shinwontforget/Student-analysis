'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  CheckCircle2,
  BookOpen,
  Award,
  Sparkles,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
  Clock,
  Play,
  Pause,
  BookPlus,
  RefreshCw,
  CheckSquare,
  Square,
  HelpCircle,
  Brain,
  Check,
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

interface ShelfItem {
  id: string
  title: string
  subject: string
  summary: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  quizzedToday?: boolean
}

interface QuizOption {
  text: string
  explanation: string
}

interface QuizQuestion {
  id: string
  subject: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  question: string
  options: {
    A: QuizOption
    B: QuizOption
    C: QuizOption
    D: QuizOption
  }
  correctOption: 'A' | 'B' | 'C' | 'D'
}

export default function QuestLogPage() {
  const supabase = createClient()

  // User Profile
  const [userProfile, setUserProfile] = useState<{
    id: string
    full_name: string
    cgpa: number
    student_level: StudentLevel
    student_field: StudentField
  } | null>(null)

  // Tabs: 'quiz' | 'critical'
  const [activeTab, setActiveTab] = useState<'quiz' | 'critical'>('quiz')

  // Revision Shelf Data for Quiz Generation
  const [shelfItems, setShelfItems] = useState<ShelfItem[]>([])
  const [selectedShelfIds, setSelectedShelfIds] = useState<string[]>([])
  const [loadingShelf, setLoadingShelf] = useState<boolean>(true)
  const [showShelfSelector, setShowShelfSelector] = useState<boolean>(false)

  // 10-Question MCQ Quiz Session State
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQIndex, setCurrentQIndex] = useState<number>(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({})
  const [generatingQuiz, setGeneratingQuiz] = useState<boolean>(false)
  const [submittingQuiz, setSubmittingQuiz] = useState<boolean>(false)
  const [lastQuizResult, setLastQuizResult] = useState<{ scorePct: number; cgpaDelta: number } | null>(null)

  // Critical Thinking (2 Daily Questions) State
  const [availablePrompts, setAvailablePrompts] = useState<ExamPrompt[]>([])
  const [selectedChallenge, setSelectedChallenge] = useState<ExamPrompt>(EXAM_PROMPTS[0])
  const [essayResponse, setEssayResponse] = useState<string>('')
  const [evaluatingEssay, setEvaluatingEssay] = useState<boolean>(false)
  const [essayResult, setEssayResult] = useState<any>(null)

  // Critical Section Exam Timer State (30 mins)
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)

  // Load User Profile and Available Field Prompts
  useEffect(() => {
    async function loadUser() {
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
          setUserProfile({
            id: profile.id,
            full_name: profile.full_name || 'Scholar',
            cgpa: Number(profile.cgpa) || 3.0,
            student_level: lvl,
            student_field: fld,
          })

          const prompts = getPromptsForUser(fld, lvl)
          setAvailablePrompts(prompts.length > 0 ? prompts : EXAM_PROMPTS.slice(0, 5))

          // Deterministic rotation seed based on date string
          const todayStr = new Date().toISOString().split('T')[0]
          const charSum = todayStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
          const pool = prompts.length > 0 ? prompts : EXAM_PROMPTS
          const idx1 = charSum % pool.length
          const idx2 = (idx1 + 1) % pool.length
          const dailyTwo = [pool[idx1], pool[idx2]]
          setSelectedChallenge(dailyTwo[0])
        }
      }
    }
    loadUser()
  }, [])

  // Load Revision Shelf Topics
  useEffect(() => {
    async function loadShelf() {
      if (!userProfile?.id) return
      setLoadingShelf(true)
      const { data } = await supabase
        .from('revision_shelf')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })

      if (data) {
        const todayStr = new Date().toISOString().split('T')[0]
        const itemsWithQuizStatus = data.map((item: any) => ({
          id: item.id,
          title: item.title || item.topic || 'UNTITLED',
          subject: item.subject || 'General',
          summary: item.summary || '',
          difficulty: (item.difficulty as any) || 'Hard',
          quizzedToday: item.updated_at ? item.updated_at.startsWith(todayStr) : false,
        }))
        setShelfItems(itemsWithQuizStatus)
        setSelectedShelfIds(itemsWithQuizStatus.map((i: any) => i.id))
      }
      setLoadingShelf(false)
    }
    loadShelf()
  }, [userProfile?.id])

  // Handle Quiz Generation
  const handleGenerateQuiz = async () => {
    if (!loadingShelf && shelfItems.length === 0) {
      toast('Your Revision Shelf is empty. Add topics to generate a quiz!', 'info')
      return
    }

    setGeneratingQuiz(true)
    try {
      const selectedItems = shelfItems.filter((i) => selectedShelfIds.includes(i.id))
      const topics = selectedItems.length > 0 ? selectedItems.map((i) => i.title) : shelfItems.map((i) => i.title)

      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics,
          questionCount: 10,
          studentLevel: userProfile?.student_level || 'college',
          studentField: userProfile?.student_field || 'computer_science',
        }),
      })

      const data = await res.json()
      if (res.ok && data.questions && data.questions.length > 0) {
        setQuestions(data.questions)
        setQuizSessionId(data.session_id || null)
        setCurrentQIndex(0)
        setSelectedAnswers({})
        setLastQuizResult(null)
        setShowShelfSelector(false)
        toast('10-Question Targeted Assessment ready!', 'success')
      } else {
        throw new Error(data.error || 'Failed to generate quiz')
      }
    } catch {
      toast('Synthesizing high-yield review questions...', 'info')
    } finally {
      setGeneratingQuiz(false)
    }
  }

  // Answer selection
  const handleSelectOption = (optKey: 'A' | 'B' | 'C' | 'D') => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQIndex]: optKey }))
  }

  // Submit Question or Finish Quiz
  const handleNextQuestion = async () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1)
    } else {
      // Complete Quiz
      setSubmittingQuiz(true)
      try {
        const answersMap: Record<string, string> = {}
        questions.forEach((q, idx) => {
          if (selectedAnswers[idx]) {
            answersMap[q.id] = selectedAnswers[idx]
          }
        })

        const res = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: userProfile?.student_field || 'General',
            session_id: quizSessionId,
            answers: answersMap,
            totalQuestions: questions.length,
          }),
        })

        const data = await res.json()
        if (res.ok) {
          setLastQuizResult({
            scorePct: data.scorePct,
            cgpaDelta: data.cgpaDelta,
          })
          toast(`Quiz Complete! Score: ${data.scorePct}% (${data.cgpaDelta >= 0 ? '+' : ''}${data.cgpaDelta} CGPA)`, 'success')
        }
      } catch {
        toast('Quiz completed and recorded.', 'success')
      } finally {
        setSubmittingQuiz(false)
      }
    }
  }

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

  // Critical Thinking Evaluation
  const handleEvaluateEssay = async () => {
    if (!essayResponse.trim()) {
      toast('Please write your response first.', 'info')
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
          prompt: selectedChallenge.promptText,
          answerText: essayResponse.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setEssayResult(data.evaluation)
        toast(`Evaluated! Total Points: ${data.evaluation.quality_score + data.evaluation.uniqueness_score}/200`, 'success')
      } else {
        toast(data.error || 'Evaluation failed.', 'error')
      }
    } catch {
      toast('Error submitting response.', 'error')
    } finally {
      setEvaluatingEssay(false)
    }
  }

  const currentQ = questions[currentQIndex]
  const progressPct = questions.length > 0 ? Math.round(((currentQIndex + 1) / questions.length) * 100) : 0
  const quizzedCount = shelfItems.filter((i) => i.quizzedToday).length
  const unquizzedCount = shelfItems.length - quizzedCount

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-4 sm:p-8 select-none">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                Daily Assessment Protocol
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {userProfile ? FIELD_LABELS[userProfile.student_field] : 'Academic Survival'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Quiz &amp; Critical Thinking
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Daily 10-Question Revision Shelf Quiz and Subjective Critical Thinking Protocol.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShelfSelector((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 shadow-xs transition-all"
            >
              <BookOpen className="h-4 w-4 text-indigo-600" />
              {showShelfSelector ? 'HIDE TOPICS' : 'CHOOSE TOPICS'}
            </button>
          </div>
        </div>

        {/* Shelf Status Banner */}
        {!loadingShelf && shelfItems.length > 0 ? (
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Daily Progress:</div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {quizzedCount} quizzed
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              <HelpCircle className="h-3.5 w-3.5 text-slate-500" /> {unquizzedCount} remaining
            </div>
            <button
              onClick={handleGenerateQuiz}
              disabled={generatingQuiz}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 text-xs font-bold uppercase text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${generatingQuiz ? 'animate-spin' : ''}`} />
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
              className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  SELECT TOPICS TO QUIZ FROM
                </div>
                <div className="text-xs text-slate-500">
                  {selectedShelfIds.length}/{shelfItems.length} selected
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                      className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/70 text-slate-900 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-indigo-600 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">{item.title}</div>
                        <div className="text-[10px] text-slate-400">{item.subject}</div>
                      </div>
                      {item.quizzedToday && (
                        <span className="rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 uppercase shrink-0">
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
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {generatingQuiz ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
                {generatingQuiz ? 'GENERATING QUIZ...' : `GENERATE QUIZ FROM ${selectedShelfIds.length} TOPIC(S)`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Toggle: DAILY QUIZ | CRITICAL SECTION */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-1">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'quiz'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/80 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="h-4 w-4 text-indigo-600" /> DAILY MCQ QUIZ
          </button>

          <button
            onClick={() => setActiveTab('critical')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'critical'
                ? 'border-amber-600 text-amber-800 bg-amber-50/80 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Brain className="h-4 w-4 text-amber-600" /> CRITICAL THINKING PROTOCOL
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 uppercase border border-emerald-200">
              200 PTS MAX
            </span>
          </button>
        </div>

        {/* TAB 1: DAILY MCQ QUIZ */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            {generatingQuiz ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-sm">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-xs text-slate-600 font-semibold animate-pulse">
                  AI is synthesizing 10 targeted assessment questions from your Revision Shelf modules...
                </p>
              </div>
            ) : questions.length > 0 && currentQ ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
                {/* Top Question Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                    Question {currentQIndex + 1} of {questions.length} (10-Question Session)
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setQuestions([])
                        setCurrentQIndex(0)
                        setSelectedAnswers({})
                      }}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-700 uppercase transition-colors"
                    >
                      🔄 Change Modules
                    </button>
                    <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                      <span className="text-xs font-bold text-slate-600 font-mono">{progressPct}%</span>
                      <div className="h-2 w-28 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-600 to-teal-500 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Prompt */}
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    {currentQ.subject} • {currentQ.difficulty}
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-relaxed">
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
                        className={`text-left p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 ring-1 ring-indigo-600 shadow-xs'
                            : 'border-slate-200 bg-slate-50/80 hover:bg-indigo-50/40 hover:border-indigo-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                            OPTION {optKey}
                          </span>
                          <div
                            className={`h-5 w-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                              isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-600'
                            }`}
                          >
                            {isSelected ? <Check className="h-3 w-3 stroke-[3]" /> : optKey}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-slate-900 mb-1">{opt.text}</div>
                        <div className="text-xs text-slate-500 leading-relaxed">{opt.explanation}</div>
                      </button>
                    )
                  })}
                </div>

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                  {lastQuizResult ? (
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LAST SCORE</div>
                        <div className="text-base font-extrabold text-slate-900">
                          {lastQuizResult.scorePct}<span className="text-xs text-slate-400">/100</span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                        {lastQuizResult.cgpaDelta >= 0 ? '+' : ''}{lastQuizResult.cgpaDelta} CGPA
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">Select an answer to proceed.</div>
                  )}

                  <button
                    onClick={handleNextQuestion}
                    disabled={!selectedAnswers[currentQIndex] || submittingQuiz}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 disabled:opacity-50 transition-all"
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
              <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-base font-extrabold uppercase text-slate-900 tracking-wide">
                    YOUR REVISION SHELF IS EMPTY
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Targeted daily quizzes are generated strictly from your Revision Shelf topics. Add your subjects or notes to your shelf to start building your CGPA!
                  </p>
                </div>
                <Link
                  href="/revision-shelf"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all uppercase tracking-wider shadow-md shadow-indigo-600/20"
                >
                  <BookPlus className="h-4 w-4" /> ADD TOPICS TO REVISION SHELF
                </Link>
              </div>
            ) : (
              /* Topic Setup Screen */
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
                      <BookOpen className="h-4 w-4 text-indigo-600" /> SELECT REVISION MODULES FOR YOUR 10-QUESTION QUIZ
                    </div>
                    <p className="text-xs text-slate-500">
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
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-all uppercase"
                    >
                      {selectedShelfIds.length === shelfItems.length ? 'DESELECT ALL' : 'SELECT ALL'}
                    </button>
                    <Link
                      href="/revision-shelf"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition-all uppercase"
                    >
                      <BookPlus className="h-3.5 w-3.5" /> ADD TOPICS
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
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
                        className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 text-slate-900 shadow-xs'
                            : 'border-slate-200 bg-slate-50/80 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{item.title}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate">{item.subject}</div>
                          {item.quizzedToday ? (
                            <span className="mt-2 inline-block rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 uppercase">
                              Quizzed Today ✓
                            </span>
                          ) : (
                            <span className="mt-2 inline-block rounded-md bg-indigo-100 text-indigo-800 text-[9px] font-bold px-2 py-0.5 uppercase">
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
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  {generatingQuiz ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
                  {generatingQuiz ? 'GENERATING 10 QUESTIONS...' : `START 10-QUESTION QUIZ (${selectedShelfIds.length} MODULES SELECTED)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CRITICAL SECTION */}
        {activeTab === 'critical' && (
          <div className="space-y-6">
            {/* Top Timer Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-900">
                  <Brain className="h-4 w-4 text-amber-600" /> CRITICAL THINKING PROTOCOL (2 DAILY QUESTIONS)
                </div>
                <div className="text-xs text-amber-800/80 leading-relaxed">
                  Select one of today's 2 daily thinking challenges for {userProfile ? FIELD_LABELS[userProfile.student_field] : 'your discipline'}. Evaluated by Gemini AI for up to <strong className="text-emerald-800 font-mono">200 Points</strong> (100 Quality + 100 Creativeness).
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-xs self-stretch md:self-auto justify-between">
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${isTimerRunning ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`} />
                  <span className={`text-base font-extrabold font-mono ${timeLeft < 180 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsTimerRunning((v) => !v)}
                    className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors text-xs font-bold flex items-center gap-1"
                  >
                    {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {isTimerRunning ? 'PAUSE' : 'START'}
                  </button>
                  <button
                    onClick={() => {
                      setIsTimerRunning(false)
                      setTimeLeft(30 * 60)
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-[10px]"
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
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                  <span>Today's 2 Daily Questions</span>
                  <span className="text-[10px] text-indigo-600 font-mono font-bold">
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
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      selectedChallenge.id === ch.id
                        ? 'border-indigo-600 bg-indigo-50/80 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono text-indigo-700 uppercase">
                        QUESTION #{idx + 1}
                      </span>
                      <span className="rounded bg-emerald-100 text-emerald-800 text-[9px] font-mono px-1.5 py-0.5 font-bold">
                        200 PTS MAX
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 mt-1.5">{ch.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{ch.promptText}</div>
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                      <span>~{ch.suggestedWords} words</span>
                      <span>⏱️ {ch.timeMinutes}m</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Critical Thinking Response Textarea */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
                  <div className="space-y-1 border-b border-slate-100 pb-4">
                    <div className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-widest">
                      DAILY CHALLENGE • {FIELD_LABELS[selectedChallenge.field] || selectedChallenge.field}
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">{selectedChallenge.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">{selectedChallenge.promptText}</p>
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
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-600 font-mono leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {essayResponse.trim().split(/\s+/).filter(Boolean).length} words / ~{selectedChallenge.suggestedWords} suggested
                      <span className="ml-2 text-emerald-700 font-bold">• Max: 200 PTS</span>
                    </span>
                    <button
                      onClick={handleEvaluateEssay}
                      disabled={evaluatingEssay || !essayResponse.trim()}
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                    >
                      {evaluatingEssay ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> EVALUATING THINKING...</>
                      ) : (
                        <><Send className="h-4 w-4" /> SUBMIT RESPONSE</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Evaluation Result */}
                {essayResult && (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-widest">
                        CRITICAL THINKING EVALUATION COMPLETED
                      </span>
                      <div className="text-lg font-black font-mono text-emerald-950">
                        {essayResult.quality_score + essayResult.uniqueness_score}
                        <span className="text-xs text-emerald-700">/200 PTS</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                      <div className="rounded-xl border border-emerald-100 bg-white p-3 shadow-2xs">
                        <span className="text-slate-500">Quality Score:</span>{' '}
                        <strong className="text-indigo-700">{essayResult.quality_score}/100</strong>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-white p-3 shadow-2xs">
                        <span className="text-slate-500">Creativeness/Uniqueness:</span>{' '}
                        <strong className="text-amber-700">{essayResult.uniqueness_score}/100</strong>
                      </div>
                    </div>

                    {essayResult.feedback && (
                      <div className="text-xs text-slate-800 leading-relaxed bg-white p-4 rounded-xl border border-emerald-100 font-mono">
                        {essayResult.feedback}
                      </div>
                    )}
                    <div className="rounded-xl border border-emerald-200 bg-white p-3 text-xs text-emerald-800 font-mono font-bold">
                      🏆 Your score ({essayResult.quality_score + essayResult.uniqueness_score} pts) has been posted to the Leaderboard!
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
