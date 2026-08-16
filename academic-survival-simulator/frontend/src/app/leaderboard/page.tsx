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
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-500 fill-amber-500" />
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />
  if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />
  return <span className="text-xs font-bold text-slate-400 font-mono">#{rank}</span>
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
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const diffTime = lastDayOfMonth.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    setResetDays(diffDays)
  }, [])

  // Load user profile & fetch leaderboard entries
  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const currentUserId = user?.id

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, student_level, student_field')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserProfile({
            id: profile.id,
            student_level: profile.student_level as StudentLevel,
            student_field: profile.student_field as StudentField,
          })
        }
      }

      // Compute timeframe start date
      let startDateStr: string
      if (timeFrame === 'daily') {
        const now = new Date()
        const startOfDayIST = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        startDateStr = startOfDayIST.toISOString()
      } else {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        startDateStr = startOfMonth.toISOString()
      }

      // Fetch all users with basic info
      const { data: users, error: usersErr } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_id, student_level, student_field, cgpa')

      if (usersErr || !users) {
        console.error('[Leaderboard fetch users error]', usersErr)
        setLoading(false)
        return
      }

      // Fetch critical thinking submissions for the timeframe
      const { data: ctSubmissions, error: ctErr } = await supabase
        .from('critical_thinking_submissions')
        .select('user_id, quality_score, uniqueness_score, score, created_at')
        .gte('created_at', startDateStr)

      if (ctErr) {
        console.error('[Leaderboard fetch CT error]', ctErr)
      }

      // Aggregate scores by user
      const userScores = new Map<string, {
        name: string
        avatarId: AvatarId
        level: StudentLevel
        field: StudentField
        totalPts: number
        bestDaily: number
        qualitySum: number
        uniquenessSum: number
        ctCount: number
        cgpa: number
      }>()

      users.forEach((u) => {
        userScores.set(u.id, {
          name: u.full_name || u.email?.split('@')[0] || 'Scholar',
          avatarId: (u.avatar_id as AvatarId) || 'boy_1',
          level: (u.student_level as StudentLevel) || 'college',
          field: (u.student_field as StudentField) || 'computer_science',
          totalPts: 0,
          bestDaily: 0,
          qualitySum: 0,
          uniquenessSum: 0,
          ctCount: 0,
          cgpa: Number(u.cgpa) || 3.0,
        })
      })

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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-mono select-none p-4 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
              <Brain className="h-3.5 w-3.5" /> CRITICAL THINKING ARENA
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-widest text-slate-900 mt-1">
              GLOBAL LEADERBOARD
            </h1>
            <p className="text-xs text-slate-600 font-sans mt-1">
              {monthName} Rankings • Daily &amp; Monthly Critical Thinking scores (200 pts max/submission).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-amber-600" /> Resets in {resetDays} days
            </div>
            <button
              onClick={fetchLeaderboard}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-all"
              title="Refresh Leaderboard"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Timeframe Toggle Bar: Monthly vs Daily (12 AM IST Reset) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
          <div className="grid grid-cols-2 gap-2 flex-1">
            <button
              onClick={() => setTimeFrame('monthly')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                timeFrame === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="h-4 w-4 text-indigo-200" /> MONTHLY RANKINGS
            </button>
            <button
              onClick={() => setTimeFrame('daily')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                timeFrame === 'daily'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Zap className="h-4 w-4 text-amber-200" /> DAILY RANKINGS (RESETS 12 AM IST)
            </button>
          </div>
        </div>

        {/* Tab Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Trophy className="h-3.5 w-3.5" /> ALL SCHOLARS
          </button>

          <button
            onClick={() => setActiveTab('my_field')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'my_field'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
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
                ? 'bg-sky-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" /> SCHOOL (9–12)
          </button>

          <button
            onClick={() => setActiveTab('college')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'college'
                ? 'bg-indigo-700 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Zap className="h-3.5 w-3.5" /> COLLEGE / UNIV
          </button>
        </div>

        {/* Podium Top 3 Cards */}
        {filteredEntries.length >= 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Rank 2 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center flex flex-col justify-between items-center space-y-3 order-2 sm:order-1 shadow-sm">
              <div className="flex justify-center">{getRankIcon(2)}</div>
              <AvatarSVG avatarId={topThree[1]?.avatarId} size={56} />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">{topThree[1]?.displayName}</h3>
                <span className="text-[10px] text-indigo-600 font-bold uppercase block">{topThree[1]?.classTitle}</span>
                <span className="text-[9px] text-slate-500 font-sans block">{FIELD_LABELS[topThree[1]?.studentField]}</span>
              </div>
              <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-2xl font-black text-slate-900">{topThree[1]?.monthlyPoints}</div>
                <div className="text-[9px] text-slate-500 uppercase">MONTHLY PTS</div>
              </div>
            </div>

            {/* Rank 1 (Center / Gold) */}
            <div className="rounded-3xl border border-amber-300 bg-amber-50/70 p-6 text-center flex flex-col justify-between items-center space-y-3 shadow-sm order-1 sm:order-2 ring-1 ring-amber-400/40">
              <div className="flex justify-center">{getRankIcon(1)}</div>
              <AvatarSVG avatarId={topThree[0]?.avatarId} size={64} />
              <div>
                <h3 className="font-black text-base text-amber-900">{topThree[0]?.displayName}</h3>
                <span className="text-[10px] text-amber-700 font-extrabold uppercase block">{topThree[0]?.classTitle}</span>
                <span className="text-[9px] text-amber-800/80 font-sans block">{FIELD_LABELS[topThree[0]?.studentField]}</span>
              </div>
              <div className="w-full rounded-2xl border border-amber-200 bg-amber-100/70 p-3">
                <div className="text-3xl font-black text-amber-900">{topThree[0]?.monthlyPoints}</div>
                <div className="text-[9px] text-amber-700 uppercase font-bold">CHAMPION PTS</div>
              </div>
            </div>

            {/* Rank 3 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center flex flex-col justify-between items-center space-y-3 order-3 shadow-sm">
              <div className="flex justify-center">{getRankIcon(3)}</div>
              <AvatarSVG avatarId={topThree[2]?.avatarId} size={56} />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">{topThree[2]?.displayName}</h3>
                <span className="text-[10px] text-indigo-600 font-bold uppercase block">{topThree[2]?.classTitle}</span>
                <span className="text-[9px] text-slate-500 font-sans block">{FIELD_LABELS[topThree[2]?.studentField]}</span>
              </div>
              <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-2xl font-black text-slate-900">{topThree[2]?.monthlyPoints}</div>
                <div className="text-[9px] text-slate-500 uppercase">MONTHLY PTS</div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 px-6 py-3.5 border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase text-slate-500 tracking-widest">
            <div className="col-span-1">RANK</div>
            <div className="col-span-6">SCHOLAR &amp; FIELD</div>
            <div className="col-span-3 text-center">TITLE</div>
            <div className="col-span-2 text-right">POINTS</div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredEntries.map((entry) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`grid grid-cols-12 items-center px-6 py-4 transition-colors ${
                  entry.isCurrentUser
                    ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="col-span-1 flex items-center font-bold">
                  {getRankIcon(entry.rank)}
                </div>

                <div className="col-span-6 flex items-center gap-3">
                  <AvatarSVG avatarId={entry.avatarId} size={36} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2 truncate">
                      {entry.displayName}
                      {entry.isCurrentUser && (
                        <span className="rounded bg-indigo-100 text-indigo-700 text-[9px] font-black px-1.5 py-0.5 uppercase">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate font-sans">
                      {LEVEL_LABELS[entry.studentLevel]} · {FIELD_LABELS[entry.studentField]}
                    </div>
                  </div>
                </div>

                <div className="col-span-3 text-center">
                  <span className="inline-block rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[10px] font-bold text-indigo-700 uppercase">
                    {entry.classTitle}
                  </span>
                </div>

                <div className="col-span-2 text-right font-black text-sm text-slate-900">
                  {entry.monthlyPoints}
                </div>
              </motion.div>
            ))}

            {filteredEntries.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
                <div className="text-4xl">🏆</div>
                <div className="space-y-1">
                  <div className="text-sm font-black uppercase tracking-wider text-slate-700">
                    No Scores Yet {activeTab !== 'all' ? 'For This Filter' : 'This Period'}
                  </div>
                  <p className="text-xs text-slate-500 font-sans max-w-xs">
                    Only scholars who have scored above 0 in the Critical Thinking section appear here. Be the first to claim your rank!
                  </p>
                </div>
                <a
                  href="/quest-log"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-indigo-700 transition-all"
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
