'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, AlertTriangle, Moon, Sparkles, MessageCircleHeart } from 'lucide-react'

interface MascotWidgetProps {
  energy: number // 0 - 100
  stress: number // 0 - 100
  studentName?: string
}

const TIPS = [
  'Pro Tip: 25-minute Pomodoro sprints boost retention by 35%!',
  'Don’t forget to hydrate! Dehydration drops focus by up to 15%.',
  'Reviewing hard concepts within 24 hours cuts forgotten info in half.',
  'Active recall > passive re-reading. Test yourself early!',
  'Sleeping 7+ hours before an exam consolidates long-term memory.',
]

export const MascotWidget: React.FC<MascotWidgetProps> = ({
  energy,
  stress,
  studentName = 'Scholar',
}) => {
  const [tipIndex, setTipIndex] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Determine Mascot Mood & State
  let mood: 'exhausted' | 'stressed' | 'overdrive' | 'balanced' = 'balanced'
  if (stress >= 70) {
    mood = 'stressed'
  } else if (energy <= 30) {
    mood = 'exhausted'
  } else if (energy >= 75 && stress <= 45) {
    mood = 'overdrive'
  }

  const handleMascotClick = () => {
    setTipIndex((prev) => (prev + 1) % TIPS.length)
    setIsSpeaking(true)
    setTimeout(() => setIsSpeaking(false), 4000)
  }

  const getMascotDetails = () => {
    switch (mood) {
      case 'stressed':
        return {
          title: 'Exam Panic Surge!',
          badge: 'High Stress',
          badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          avatar: '💥🤯⚡',
          dialogue: `Woah ${studentName}! Stress is at ${stress}%! Take a 5-min walk, grab water, and hit RevisionShelf!`,
          borderColor: 'border-rose-500/50',
          bgGradient: 'from-rose-950/40 via-red-900/20 to-zinc-900',
          glow: 'shadow-[0_0_30px_rgba(244,63,94,0.25)]',
          icon: <AlertTriangle className="h-4 w-4 text-rose-400 animate-pulse" />,
        }
      case 'exhausted':
        return {
          title: 'Low Battery Alert',
          badge: 'Low Energy',
          badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          avatar: '😴💤🔋',
          dialogue: `Energy is down to ${energy}%... I'm powering down. Sleep slider up, study slider down!`,
          borderColor: 'border-amber-500/50',
          bgGradient: 'from-amber-950/40 via-yellow-900/20 to-zinc-900',
          glow: 'shadow-[0_0_30px_rgba(245,158,11,0.25)]',
          icon: <Moon className="h-4 w-4 text-amber-400 animate-bounce" />,
        }
      case 'overdrive':
        return {
          title: 'Academic Overdrive!',
          badge: 'Peak Performance',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          avatar: '🚀⚡👑',
          dialogue: `YES! ${energy}% Energy & low stress! You're in absolute flow state right now!`,
          borderColor: 'border-emerald-500/50',
          bgGradient: 'from-emerald-950/40 via-teal-900/20 to-zinc-900',
          glow: 'shadow-[0_0_35px_rgba(16,185,129,0.3)]',
          icon: <Zap className="h-4 w-4 text-emerald-400" />,
        }
      default:
        return {
          title: 'Byte - AI Companion',
          badge: 'Balanced',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          avatar: '🤖📚✨',
          dialogue: `Hey ${studentName}! I'm tracking your stamina & performance. Adjust sliders or ask me anything!`,
          borderColor: 'border-indigo-500/40',
          bgGradient: 'from-indigo-950/40 via-purple-900/20 to-zinc-900',
          glow: 'shadow-[0_0_30px_rgba(99,102,241,0.2)]',
          icon: <Sparkles className="h-4 w-4 text-indigo-400" />,
        }
    }
  }

  const details = getMascotDetails()

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border ${details.borderColor} bg-gradient-to-br ${details.bgGradient} p-6 backdrop-blur-xl ${details.glow} transition-all duration-500`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Mascot Avatar & Status */}
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMascotClick}
            className="cursor-pointer relative flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-950/60 border border-white/10 text-4xl shadow-inner select-none"
          >
            {details.avatar}
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white"
            >
              💬
            </motion.span>
          </motion.div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-white">{details.title}</h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${details.badgeBg}`}
              >
                {details.icon}
                {details.badge}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Click Byte for quick survival tips & advice!
            </p>
          </div>
        </div>

        {/* Energy & Stress Gauge Stats */}
        <div className="flex gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
              <Zap className="h-3 w-3 text-emerald-400" /> Energy
            </span>
            <span className="text-xl font-bold text-emerald-300">{energy}%</span>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-rose-400" /> Stress
            </span>
            <span className="text-xl font-bold text-rose-300">{stress}%</span>
          </div>
        </div>
      </div>

      {/* Mascot Speech Bubble */}
      <div className="mt-4 relative rounded-xl border border-white/10 bg-zinc-950/70 p-4 text-sm text-zinc-200 shadow-inner">
        <div className="flex items-start gap-2">
          <MessageCircleHeart className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <AnimatePresence mode="wait">
            <motion.p
              key={isSpeaking ? `tip-${tipIndex}` : mood}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="italic leading-relaxed"
            >
              {isSpeaking ? `💡 ${TIPS[tipIndex]}` : details.dialogue}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

export default MascotWidget
