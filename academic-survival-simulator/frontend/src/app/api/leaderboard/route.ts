import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { GamificationEngine } from '@/lib/services/gamificationEngine'

// Force dynamic rendering — this route reads server data
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 0. Require authenticated session — leaderboard contains user PII
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // 1. Fetch only active submissions for the current month
    const { data: ctSubmissions, error: ctErr } = await adminSupabase
      .from('critical_thinking_submissions')
      .select('user_id, quality_score, uniqueness_score')
      .gte('created_at', startOfMonth.toISOString())

    if (ctErr) {
      console.error('[Leaderboard CT Error]:', ctErr)
    }

    // 2. Aggregate monthly scores per active user in O(M) time
    const userScores = new Map<string, number>()
    if (ctSubmissions) {
      for (const s of ctSubmissions) {
        const pts = (s.quality_score ?? 0) + (s.uniqueness_score ?? 0)
        if (pts > 0 && s.user_id) {
          userScores.set(s.user_id, (userScores.get(s.user_id) || 0) + pts)
        }
      }
    }

    if (userScores.size === 0) {
      return NextResponse.json({
        leaderboard: [],
        total: 0,
        cached_at: new Date().toISOString(),
      })
    }

    // 3. Sort active user IDs by highest score and take top 100
    const topEntries = Array.from(userScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)

    const topUserIds = topEntries.map(([id]) => id)

    // 4. Query ONLY the top 100 active users instead of dumping the entire user database
    const { data: users } = await adminSupabase
      .from('users')
      .select('id, full_name, avatar_id, cgpa, student_level, student_field')
      .in('id', topUserIds)

    const userProfileMap = new Map<string, any>()
    if (users) {
      for (const u of users) {
        userProfileMap.set(u.id, u)
      }
    }

    // 5. Build final sorted leaderboard response in O(K) where K <= 100
    const formattedLeaderboard = topEntries.map(([userId, score], index) => {
      const profile = userProfileMap.get(userId)
      const cgpa = Number(profile?.cgpa) || 3.0
      return {
        rank: index + 1,
        id: userId,
        user_id: userId,
        display_name: profile?.full_name || 'Scholar',
        score,
        cgpa,
        class_title: GamificationEngine.getClassTitle(cgpa),
      }
    })

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
