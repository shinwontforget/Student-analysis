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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg rounded-3xl border border-violet-500/30 bg-[#0d0c1d] p-6 shadow-2xl space-y-6 font-mono text-zinc-100"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <AvatarSVG avatarId={user.avatar_id ?? 'boy_1'} size={56} />
            <div>
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-violet-400">
                <Calendar className="h-3.5 w-3.5" /> 7-DAY ACADEMIC REPORT
              </div>
              <h2 className="text-xl font-black text-white">{user.full_name}'s Weekly Summary</h2>
              <div className="text-[11px] text-zinc-400 font-sans">
                {user.student_level ? LEVEL_LABELS[user.student_level] : 'College'} · {user.student_field ? FIELD_LABELS[user.student_field] : 'Computer Science'}
              </div>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-violet-500/20 bg-violet-950/20 p-3.5 text-center">
              <div className="flex justify-center mb-1 text-violet-400"><Zap className="h-4 w-4 fill-current" /></div>
              <div className="text-2xl font-black text-white">{actualStats.quizzesCompleted} / 7</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">Quizzes Completed</div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 text-center">
              <div className="flex justify-center mb-1 text-emerald-400"><Trophy className="h-4 w-4" /></div>
              <div className="text-2xl font-black text-white">{actualStats.avgScorePct}%</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">Avg Quiz Score</div>
            </div>

            <div className="rounded-2xl border border-pink-500/20 bg-pink-950/20 p-3.5 text-center">
              <div className="flex justify-center mb-1 text-pink-400"><Brain className="h-4 w-4" /></div>
              <div className="text-2xl font-black text-white">{actualStats.examsSubmitted}</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">Written Exams</div>
            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-3.5 text-center">
              <div className="flex justify-center mb-1 text-cyan-400"><Sparkles className="h-4 w-4" /></div>
              <div className="text-2xl font-black text-cyan-300">
                {actualStats.cgpaChange >= 0 ? '+' : ''}{actualStats.cgpaChange.toFixed(2)}
              </div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">CGPA Change</div>
            </div>
          </div>

          {/* AI Advisor Tip */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1.5 font-sans">
            <div className="text-[10px] font-extrabold font-mono uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              💡 SCHOLAR AI ADVISOR TIP
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed">
              "{actualStats.weeklyTip}"
            </p>
          </div>

          {/* Footer Action */}
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-all"
          >
            CONTINUE YOUR JOURNEY <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default WeeklyReviewModal
