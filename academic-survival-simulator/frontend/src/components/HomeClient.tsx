'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Zap,
  BookOpen,
  Trophy,
  ArrowRight,
  Terminal,
  Brain,
  Shield,
  Swords,
} from 'lucide-react'
import Logo from './Logo'

const features = [
  {
    icon: <TrendingUp className="h-6 w-6" />,
    color: 'indigo',
    title: 'S-Curve Delta CGPA',
    desc: 'Logistic curve scaling prevents unrealistic GPA jumps. Every quiz answer moves your real CGPA.',
  },
  {
    icon: <Trophy className="h-6 w-6" />,
    color: 'amber',
    title: 'Critical Thinking Arena',
    desc: '200 pts per submission (100 quality + 100 uniqueness) powering a monthly leaderboard reset.',
  },
  {
    icon: <BookOpen className="h-6 w-6" />,
    color: 'emerald',
    title: 'Revision Shelf & Library',
    desc: 'Save tough concepts, flag Hard topics, get AI + YouTube explanations instantly.',
  },
  {
    icon: <Brain className="h-6 w-6" />,
    color: 'indigo',
    title: 'AI Mascot Companion ("Byte")',
    desc: 'Ask your mascot anything. It explains concepts, motivates you, and generates exam gotchas.',
  },
  {
    icon: <Swords className="h-6 w-6" />,
    color: 'cyan',
    title: 'Quest Log & Daily Quiz',
    desc: '10 Gemini-generated MCQs daily from your revision shelf. Correct answers = real CGPA gain.',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    color: 'emerald',
    title: 'Merit Exam Mode (CGPA ≥ 7.5)',
    desc: '1-Hour, 5-question comprehensive written exam unlocked purely by academic merit.',
  },
]

const colorMap: Record<string, string> = {
  indigo:  'bg-indigo-50 text-indigo-600 border-indigo-200',
  amber:   'bg-amber-50 text-amber-600 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  cyan:    'bg-sky-50 text-sky-600 border-sky-200',
}

export default function HomeClient() {
  return (
    <div className="relative overflow-hidden bg-slate-50 text-slate-900 min-h-screen font-mono select-none">
      {/* Subtle Ambient Light Gradients */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-indigo-100/70 via-slate-100/50 to-blue-100/60 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[350px] w-[500px] rounded-full bg-gradient-to-tl from-indigo-50/80 to-slate-100/50 blur-[100px]" />

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="mx-auto max-w-4xl space-y-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/90 px-4 py-1.5 text-xs font-bold text-indigo-700 shadow-sm backdrop-blur-md">
            <Logo size={18} />
            <span className="uppercase tracking-widest">ACADEMIC_SURVIVAL.EXE V2.0</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 uppercase leading-none">
            BUILD YOUR SEMESTER.{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800 bg-clip-text text-transparent">
              SEE WHAT BREAKS FIRST.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm text-slate-600 leading-relaxed font-sans">
            S-Curve CGPA engine, daily targeted quizzes, AI mascot companion, critical thinking leaderboard, and merit-unlocked exam evaluation. Your academic journey starts here.
          </p>

          <div className="flex justify-center pt-2">
            <Link
              href="/signup"
              className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 px-10 py-4 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all"
            >
              <Zap className="h-4 w-4 fill-current" /> START YOUR JOURNEY <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mini stats */}
          <div className="flex flex-wrap justify-center gap-6 pt-4 text-xs text-slate-500 font-sans">
            {['S-Curve GPA Engine', 'Gemini AI Grading', 'Merit Exam Mode', 'Supabase Auth', 'Monthly Leaderboard'].map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" /> {s}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FEATURE GRID */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * i, duration: 0.5 }}
              className="group rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-300"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${colorMap[f.color] || colorMap.indigo}`}>
                {f.icon}
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">{f.title}</h3>
              <p className="text-xs text-slate-600 font-sans leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 font-mono">
        <p>ACADEMIC SURVIVAL SIMULATOR V2.0 • NEXT.JS, GEMINI AI & SUPABASE</p>
      </footer>
    </div>
  )
}
