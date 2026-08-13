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
    color: 'violet',
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
    color: 'pink',
    title: 'Revision Shelf & Rescue',
    desc: 'Save tough concepts, flag Hard topics, get AI + YouTube explanations instantly.',
  },
  {
    icon: <Brain className="h-6 w-6" />,
    color: 'emerald',
    title: 'AI Mascot Tutor',
    desc: 'Ask your mascot anything. It explains concepts, motivates you, and tracks your progress.',
  },
  {
    icon: <Swords className="h-6 w-6" />,
    color: 'cyan',
    title: 'Quest Log & Daily Quiz',
    desc: '10 Gemini-generated MCQs daily from your revision shelf. Correct answers = real CGPA gain.',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    color: 'rose',
    title: 'Premium Pass',
    desc: 'Unlock Essay Mode (CGPA < 7.5), advanced analytics, and remove all daily limits.',
  },
]

const colorMap: Record<string, string> = {
  violet:  'bg-violet-600/20 text-violet-400 border-violet-500/30',
  amber:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  pink:    'bg-pink-500/20 text-pink-400 border-pink-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cyan:    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  rose:    'bg-rose-500/20 text-rose-400 border-rose-500/30',
}

export default function HomeClient() {
  return (
    <div className="relative overflow-hidden bg-[#070712] text-zinc-100 min-h-screen font-mono select-none">
      {/* Glow Orbs */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-tr from-violet-600/25 via-purple-600/15 to-pink-500/10 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-gradient-to-tl from-cyan-600/10 to-violet-600/10 blur-[120px]" />

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="mx-auto max-w-4xl space-y-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/50 px-4 py-1.5 text-xs font-bold text-violet-300 shadow-inner backdrop-blur-md">
            <Logo size={18} className="animate-pulse" />
            <span className="uppercase tracking-widest">ACADEMIC_SURVIVAL.EXE V2.0</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase leading-none">
            BUILD YOUR SEMESTER.{' '}
            <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              SEE WHAT BREAKS FIRST.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm text-zinc-400 leading-relaxed font-sans">
            S-Curve CGPA engine, daily quizzes, AI mascot companion, critical thinking leaderboard, and Razorpay premium passes. Your academic survival starts here.
          </p>

          <div className="flex justify-center pt-2">
            <Link
              href="/signup"
              className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-violet-600 px-10 py-4 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_30px_rgba(139,92,246,0.45)] hover:bg-violet-500 active:scale-[0.98] transition-all"
            >
              <Zap className="h-4 w-4 fill-current" /> START YOUR JOURNEY <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mini stats */}
          <div className="flex flex-wrap justify-center gap-6 pt-4 text-xs text-zinc-500 font-sans">
            {['S-Curve GPA Engine', 'Gemini AI Grading', 'Razorpay Payments', 'Supabase Auth', 'Monthly Leaderboard'].map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-violet-400" /> {s}
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
              className="group rounded-3xl border border-white/10 bg-[#0d0c1d] p-6 space-y-4 hover:border-white/20 hover:bg-[#110f28] transition-all duration-300"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${colorMap[f.color]}`}>
                {f.icon}
              </div>
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">{f.title}</h3>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#070712] py-8 text-center text-xs text-zinc-500 font-mono">
        <p>ACADEMIC SURVIVAL SIMULATOR V2.0 • NEXT.JS, GEMINI AI & SUPABASE</p>
      </footer>
    </div>
  )
}
