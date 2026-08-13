'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Crown, Medal, Award, Brain, RefreshCw, Calendar, Zap, User, GraduationCap, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AvatarSVG, { AvatarId } from '@/components/Avatar'
import { FIELD_LABELS, LEVEL_LABELS, StudentLevel, StudentField } from '@/data/essay-challenges'

interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  avatarId: AvatarId
  studentLevel: StudentLevel
  studentField: StudentField
  monthlyPoints: number      // sum of quality + uniqueness (or quiz pts)
  bestDailyScore: number     // best daily score out of 200
  qualityAvg: number         // avg quality component (0-100)
  uniquenessAvg: number      // avg uniqueness component (0-100)
  submissionsThisMonth: number
  classTitle: string
  isCurrentUser?: boolean
}

type LeaderboardTab = 'my_field' | 'all' | 'school' | 'college'

function getClassTitle(pts: number): string {
  if (pts >= 1600) return 'Critical Genius'
  if (pts >= 1200) return 'Thought Architect'
  if (pts >= 900)  return 'Idea Weaver'
  if (pts >= 600)  return 'Rising Challenger'
  if (pts >= 300)  return 'Scholar'
  return 'Learner'
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-400 fill-amber-400" />
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-300" />
  if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />
  return <span className="text-xs font-bold text-zinc-500 font-mono">#{rank}</span>
}

const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

export default function LeaderboardPage() {
  const supabase = createClient()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [resetDays, setResetDays] = useState(0)
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('all')
  const [timeFrame, setTimeFrame] = useState<'monthly' | 'daily'>('monthly')
  const [userProfile, setUserProfile] = useState<{
    id: string
    student_level: StudentLevel
    student_field: StudentField
  } | null>(null)

  // Days until month reset
  useEffect(() => {
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    setResetDays(Math.ceil((nextMonth.getTime() - now.getTime()) / 86400000))
  }, [])

  // Fetch dynamic real data from Supabase strictly from Critical Thinking submissions
  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const currentUserId = user?.id

      if (currentUserId) {
        const { data: me } = await supabase
          .from('users')
          .select('id, student_level, student_field')
          .eq('id', currentUserId)
          .single()
        if (me) {
          setUserProfile({
            id: me.id,
            student_level: (me.student_level as StudentLevel) || 'college',
            student_field: (me.student_field as StudentField) || 'computer_science',
          })
        }
      }

      // 1. Fetch all registered users
      const { data: dbUsers } = await supabase
        .from('users')
        .select('id, full_name, cgpa, avatar_id, student_level, student_field')

      // 2. Determine start date cutoff based on timeFrame
      let cutoffIso: string
      if (timeFrame === 'daily') {
        // Calculate 12:00 AM IST today (UTC + 5:30)
        const now = new Date()
        const istDateStr = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0]
        cutoffIso = new Date(`${istDateStr}T00:00:00.000+05:30`).toISOString()
      } else {
        // Start of current month UTC
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        cutoffIso = startOfMonth.toISOString()
      }

      // 3. Query ONLY real Critical Thinking submissions created since cutoff
      const { data: ctSubmissions } = await supabase
        .from('critical_thinking_submissions')
        .select('user_id, quality_score, uniqueness_score, created_at')
        .gte('created_at', cutoffIso)

      // 4. Map & Aggregate scores strictly from Critical Thinking section
      const userScores = new Map<string, {
        name: string
        avatarId: AvatarId
        level: StudentLevel
        field: StudentField
        cgpa: number
        totalPts: number
        bestDaily: number
        qualitySum: number
        uniquenessSum: number
        ctCount: number
      }>()

      // Only seed users who have real Critical Thinking submissions this period (no 0-score padding)
      const submittedUserIds = new Set((ctSubmissions || []).map((s) => s.user_id))
      if (dbUsers) {
        dbUsers.forEach((u) => {
          if (submittedUserIds.has(u.id)) {
            userScores.set(u.id, {
              name: u.full_name || 'Scholar',
              avatarId: (u.avatar_id as AvatarId) || 'boy_1',
              level: (u.student_level as StudentLevel) || 'college',
              field: (u.student_field as StudentField) || 'computer_science',
              cgpa: Number(u.cgpa) || 3.0,
              totalPts: 0,
              bestDaily: 0,
              qualitySum: 0,
              uniquenessSum: 0,
              ctCount: 0,
            })
          }
        })
      }

      // Aggregate real Critical Thinking submission points (quality + uniqueness)
      if (ctSubmissions) {
        ctSubmissions.forEach((sub) => {
          const uid = sub.user_id
          const q = sub.quality_score ?? 0
          const u = sub.uniqueness_score ?? 0
          const pts = q + u

          const existing = userScores.get(uid)
          if (existing) {
            existing.totalPts += pts
            existing.bestDaily = Math.max(existing.bestDaily, pts)
            existing.qualitySum += q
            existing.uniquenessSum += u
            existing.ctCount += 1
          }
        })
      }

      // Format & Sort entries — strictly only users with actual CT scores (> 0)
      const formatted: LeaderboardEntry[] = Array.from(userScores.entries())
        .map(([id, v]) => {
          const count = v.ctCount || 1
          return {
            rank: 0,
            userId: id,
            displayName: v.name,
            avatarId: v.avatarId,
            studentLevel: v.level,
            studentField: v.field,
            monthlyPoints: v.totalPts,
            bestDailyScore: v.bestDaily,
            qualityAvg: Math.round(v.qualitySum / count),
            uniquenessAvg: Math.round(v.uniquenessSum / count),
            submissionsThisMonth: v.ctCount,
            classTitle: getClassTitle(v.totalPts),
            isCurrentUser: id === currentUserId,
          }
        })
        .filter((entry) => entry.monthlyPoints > 0)
        .sort((a, b) => b.monthlyPoints - a.monthlyPoints)
        .map((item, idx) => ({ ...item, rank: idx + 1 }))

      setEntries(formatted)
    } catch (err) {
      console.error('[Leaderboard fetch error]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [timeFrame])

  // Filter entries according to activeTab
  const filteredEntries = entries.filter((e) => {
    if (activeTab === 'my_field') {
      return userProfile ? e.studentField === userProfile.student_field : true
    }
    if (activeTab === 'school') {
      return e.studentLevel === 'school_9_10' || e.studentLevel === 'school_11_12'
    }
    if (activeTab === 'college') {
      return e.studentLevel === 'college' || e.studentLevel === 'postgraduate'
    }
    return true // 'all'
  })

  const topThree = filteredEntries.slice(0, 3)

  return (
    <div className="min-h-screen bg-[#070712] text-zinc-100 font-mono select-none p-4 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-violet-400">
              <Brain className="h-3.5 w-3.5" /> CRITICAL THINKING ARENA
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-widest text-white mt-1">
              GLOBAL LEADERBOARD
            </h1>
            <p className="text-xs text-zinc-400 font-sans mt-1">
              {monthName} Rankings • Daily &amp; Monthly Critical Thinking scores (200 pts max/submission).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-3.5 py-2 text-xs font-bold text-amber-300 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-amber-400" /> Resets in {resetDays} days
            </div>
            <button
              onClick={fetchLeaderboard}
              disabled={loading}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
              title="Refresh Leaderboard"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Timeframe Toggle Bar: Monthly vs Daily (12 AM IST Reset) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d0c1d] border border-white/10 p-2 rounded-2xl">
          <div className="grid grid-cols-2 gap-2 flex-1">
            <button
              onClick={() => setTimeFrame('monthly')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                timeFrame === 'monthly'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="h-4 w-4 text-violet-300" /> MONTHLY RANKINGS
            </button>
            <button
              onClick={() => setTimeFrame('daily')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                timeFrame === 'daily'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="h-4 w-4 text-amber-300" /> DAILY RANKINGS (RESETS 12 AM IST)
            </button>
          </div>
        </div>

        {/* Tab Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'all'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Trophy className="h-3.5 w-3.5" /> ALL SCHOLARS
          </button>

          <button
            onClick={() => setActiveTab('my_field')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'my_field'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Filter className="h-3.5 w-3.5" /> MY FIELD
            {userProfile && (
              <span className="text-[9px] opacity-80 font-normal">
                ({FIELD_LABELS[userProfile.student_field]})
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('school')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'school'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" /> SCHOOL (9–12)
          </button>

          <button
            onClick={() => setActiveTab('college')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'college'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Zap className="h-3.5 w-3.5" /> COLLEGE / UNIV
          </button>
        </div>

        {/* Podium Top 3 Cards */}
        {filteredEntries.length >= 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Rank 2 */}
            <div className="rounded-3xl border border-slate-700/50 bg-[#0d0c1d] p-6 text-center flex flex-col justify-between items-center space-y-3 order-2 sm:order-1">
              <div className="flex justify-center">{getRankIcon(2)}</div>
              <AvatarSVG avatarId={topThree[1]?.avatarId} size={56} />
              <div>
                <h3 className="font-extrabold text-sm text-white">{topThree[1]?.displayName}</h3>
                <span className="text-[10px] text-violet-400 font-bold uppercase block">{topThree[1]?.classTitle}</span>
                <span className="text-[9px] text-zinc-500 font-sans block">{FIELD_LABELS[topThree[1]?.studentField]}</span>
              </div>
              <div className="w-full rounded-2xl border border-white/10 bg-[#070712] p-3">
                <div className="text-2xl font-black text-white">{topThree[1]?.monthlyPoints}</div>
                <div className="text-[9px] text-zinc-500 uppercase">MONTHLY PTS</div>
              </div>
            </div>

            {/* Rank 1 (Center / Gold) */}
            <div className="rounded-3xl border border-amber-500/50 bg-[#120f26] p-6 text-center flex flex-col justify-between items-center space-y-3 shadow-[0_0_40px_rgba(245,158,11,0.2)] order-1 sm:order-2 ring-1 ring-amber-500/40">
              <div className="flex justify-center">{getRankIcon(1)}</div>
              <AvatarSVG avatarId={topThree[0]?.avatarId} size={64} />
              <div>
                <h3 className="font-black text-base text-amber-300">{topThree[0]?.displayName}</h3>
                <span className="text-[10px] text-amber-400 font-extrabold uppercase block">{topThree[0]?.classTitle}</span>
                <span className="text-[9px] text-amber-200/60 font-sans block">{FIELD_LABELS[topThree[0]?.studentField]}</span>
              </div>
              <div className="w-full rounded-2xl border border-amber-500/30 bg-amber-950/40 p-3">
                <div className="text-3xl font-black text-amber-300">{topThree[0]?.monthlyPoints}</div>
                <div className="text-[9px] text-amber-400/70 uppercase font-bold">CHAMPION PTS</div>
              </div>
            </div>

            {/* Rank 3 */}
            <div className="rounded-3xl border border-amber-800/40 bg-[#0d0c1d] p-6 text-center flex flex-col justify-between items-center space-y-3 order-3">
              <div className="flex justify-center">{getRankIcon(3)}</div>
              <AvatarSVG avatarId={topThree[2]?.avatarId} size={56} />
              <div>
                <h3 className="font-extrabold text-sm text-white">{topThree[2]?.displayName}</h3>
                <span className="text-[10px] text-violet-400 font-bold uppercase block">{topThree[2]?.classTitle}</span>
                <span className="text-[9px] text-zinc-500 font-sans block">{FIELD_LABELS[topThree[2]?.studentField]}</span>
              </div>
              <div className="w-full rounded-2xl border border-white/10 bg-[#070712] p-3">
                <div className="text-2xl font-black text-white">{topThree[2]?.monthlyPoints}</div>
                <div className="text-[9px] text-zinc-500 uppercase">MONTHLY PTS</div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="rounded-3xl border border-white/10 bg-[#0d0c1d] overflow-hidden shadow-2xl">
          <div className="grid grid-cols-12 px-6 py-3.5 border-b border-white/10 text-[10px] font-extrabold uppercase text-zinc-500 tracking-widest">
            <div className="col-span-1">RANK</div>
            <div className="col-span-6">SCHOLAR &amp; FIELD</div>
            <div className="col-span-3 text-center">TITLE</div>
            <div className="col-span-2 text-right">POINTS</div>
          </div>

          <div className="divide-y divide-white/5">
            {filteredEntries.map((entry) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`grid grid-cols-12 items-center px-6 py-4 transition-colors ${
                  entry.isCurrentUser
                    ? 'bg-violet-950/40 border-l-4 border-violet-500'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="col-span-1 flex items-center font-bold">
                  {getRankIcon(entry.rank)}
                </div>

                <div className="col-span-6 flex items-center gap-3">
                  <AvatarSVG avatarId={entry.avatarId} size={36} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-2 truncate">
                      {entry.displayName}
                      {entry.isCurrentUser && (
                        <span className="rounded bg-violet-500/20 text-violet-300 text-[9px] font-black px-1.5 py-0.5 uppercase">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate font-sans">
                      {LEVEL_LABELS[entry.studentLevel]} · {FIELD_LABELS[entry.studentField]}
                    </div>
                  </div>
                </div>

                <div className="col-span-3 text-center">
                  <span className="inline-block rounded-lg bg-violet-950/60 border border-violet-500/20 px-2.5 py-1 text-[10px] font-bold text-violet-300 uppercase">
                    {entry.classTitle}
                  </span>
                </div>

                <div className="col-span-2 text-right font-black text-sm text-white">
                  {entry.monthlyPoints}
                </div>
              </motion.div>
            ))}

            {filteredEntries.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
                <div className="text-4xl">🏆</div>
                <div className="space-y-1">
                  <div className="text-sm font-black uppercase tracking-wider text-zinc-300">
                    No Scores Yet {activeTab !== 'all' ? 'For This Filter' : 'This Period'}
                  </div>
                  <p className="text-xs text-zinc-500 font-sans max-w-xs">
                    Only scholars who have scored above 0 in the Critical Thinking section appear here. Be the first to claim your rank!
                  </p>
                </div>
                <a
                  href="/quest-log"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-violet-600/30 hover:brightness-110 transition-all"
                >
                  ⚡ Take the Critical Thinking Challenge
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
