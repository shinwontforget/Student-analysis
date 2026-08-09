import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GamificationEngine } from '@/lib/services/gamificationEngine'

// Enforce 60-second caching for this Route Handler
export const revalidate = 60

export async function GET() {
  try {
    const supabase = await createClient()

    // Query top 50 leaderboard entries ordered by score descending
    const { data: entries, error } = await supabase
      .from('leaderboard')
      .select('id, user_id, display_name, score, rank, period, updated_at')
      .order('score', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[Leaderboard GET] Database query error:', error)
      return NextResponse.json(
        { error: 'Failed to retrieve leaderboard data' },
        { status: 500 }
      )
    }

    // Enhance records with calculated rank and class titles
    const formattedLeaderboard = (entries || []).map((entry, index) => {
      const cgpaEquivalent = entry.score / 100.0
      return {
        rank: index + 1,
        id: entry.id,
        user_id: entry.user_id,
        display_name: entry.display_name,
        score: entry.score,
        cgpa: Math.min(10.0, Math.max(0.0, Number(cgpaEquivalent.toFixed(2)))),
        class_title: GamificationEngine.getClassTitle(cgpaEquivalent),
        updated_at: entry.updated_at,
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
