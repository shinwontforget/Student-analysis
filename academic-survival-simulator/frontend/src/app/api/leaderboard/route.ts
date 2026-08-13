import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GamificationEngine } from '@/lib/services/gamificationEngine'

// Force dynamic rendering — this route uses cookies() via Supabase server client
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // Query users and Critical Thinking submissions
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, avatar_id, cgpa, student_level, student_field')

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: ctSubmissions } = await supabase
      .from('critical_thinking_submissions')
      .select('user_id, quality_score, uniqueness_score')
      .gte('created_at', startOfMonth.toISOString())

    const userMap = new Map<string, {
      id: string
      name: string
      cgpa: number
      score: number
    }>()

    if (users) {
      users.forEach((u) => {
        userMap.set(u.id, {
          id: u.id,
          name: u.full_name || 'Scholar',
          cgpa: Number(u.cgpa) || 3.0,
          score: 0,
        })
      })
    }

    if (ctSubmissions) {
      ctSubmissions.forEach((s) => {
        const existing = userMap.get(s.user_id)
        if (existing) {
          existing.score += (s.quality_score ?? 0) + (s.uniqueness_score ?? 0)
        }
      })
    }

    const formattedLeaderboard = Array.from(userMap.values())
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        rank: index + 1,
        id: entry.id,
        user_id: entry.id,
        display_name: entry.name,
        score: entry.score,
        cgpa: entry.cgpa,
        class_title: GamificationEngine.getClassTitle(entry.cgpa),
      }))

    return NextResponse.json(
      {
        leaderboard: formattedLeaderboard,
        total: formattedLeaderboard.length,
        cached_at: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    )
  } catch (err: any) {
    console.error('[Leaderboard GET Handler Error]:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
