'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Trophy, Zap, Brain, X, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import { AvatarSVG, AvatarId } from './Avatar'
import { FIELD_LABELS, LEVEL_LABELS, StudentLevel, StudentField } from '@/data/essay-challenges'

interface WeeklyReviewModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    full_name: string
    avatar_id?: AvatarId
    student_level?: StudentLevel
    student_field?: StudentField
    cgpa: number
  }
  stats?: {
    quizzesCompleted: number
    avgScorePct: number
    examsSubmitted: number
    cgpaChange: number
    weeklyTip: string
  }
}

export function WeeklyReviewModal({ isOpen, onClose, user, stats }: WeeklyReviewModalProps) {
  if (!isOpen) return null

  const actualStats = stats || {
    quizzesCompleted: 0,
    avgScorePct: 0,
    examsSubmitted: 0,
    cgpaChange: 0.00,
    weeklyTip: 'No activity recorded yet for this week. Complete daily quizzes from your Revision Shelf and submit Critical Thinking essays to boost your CGPA!',
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-6 font-mono text-slate-900"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            <AvatarSVG avatarId={user.avatar_id ?? 'boy_1'} size={56} />
            <div>
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
                <Calendar className="h-3.5 w-3.5" /> 7-DAY ACADEMIC REPORT
              </div>
              <h2 className="text-xl font-black text-slate-900">{user.full_name}'s Weekly Summary</h2>
              <div className="text-[11px] text-slate-500 font-sans">
                {user.student_level ? LEVEL_LABELS[user.student_level] : 'College'} · {user.student_field ? FIELD_LABELS[user.student_field] : 'Computer Science'}
              </div>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3.5 text-center">
              <div className="flex justify-center mb-1 text-indigo-600"><Zap className="h-4 w-4 fill-current" /></div>
              <div className="text-2xl font-black text-slate-900">{actualStats.quizzesCompleted} / 7</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Quizzes Completed</div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-center">
              <div className="flex justify-center mb-1 text-emerald-600"><Trophy className="h-4 w-4" /></div>
              <div className="text-2xl font-black text-slate-900">{actualStats.avgScorePct}%</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Avg Accuracy</div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-center">
              <div className="flex justify-center mb-1 text-amber-600"><Brain className="h-4 w-4" /></div>
              <div className="text-2xl font-black text-slate-900">{actualStats.examsSubmitted}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Exams Submitted</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-center">
              <div className="flex justify-center mb-1 text-slate-600"><Sparkles className="h-4 w-4" /></div>
              <div className={`text-2xl font-black ${actualStats.cgpaChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {actualStats.cgpaChange >= 0 ? '+' : ''}{actualStats.cgpaChange.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">7-Day Net CGPA</div>
            </div>
          </div>

          {/* AI Advisor Advice */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-indigo-700 uppercase tracking-wider">
              <span>🦉 BYTE'S STRATEGY NOTE</span>
            </div>
            <p className="text-xs text-slate-700 font-sans leading-relaxed">
              {actualStats.weeklyTip}
            </p>
          </div>

          {/* Action button */}
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-indigo-700 transition-all"
          >
            CONTINUE GRIND <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
