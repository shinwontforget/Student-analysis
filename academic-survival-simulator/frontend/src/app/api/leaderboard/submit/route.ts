import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateGPA } from '@/lib/pythonService'
import { GamificationEngine } from '@/lib/services/gamificationEngine'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid user session required' },
        { status: 401 }
      )
    }

    // 2. Parse request payload
    const body = await request.json().catch(() => ({}))
    const { quiz_score, client_expected_cgpa } = body

    if (typeof quiz_score !== 'number' || quiz_score < 0 || quiz_score > 100) {
      return NextResponse.json(
        { error: 'Invalid quiz_score. Must be a number between 0 and 100.' },
        { status: 400 }
      )
    }

    // 3. Fetch user's current profile from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('cgpa, is_premium, full_name, email')
      .eq('id', user.id)
      .single()

    const currentCGPA = profile?.cgpa ?? 0.0
    const isPremium = profile?.is_premium ?? false
    const displayName =
      profile?.full_name || profile?.email?.split('@')[0] || 'Student'

    // 4. Server-Side Recomputation: Call Python FastAPI backend via pythonService.ts
    const gpaResult = (await calculateGPA(
      { cgpa: currentCGPA, is_premium: isPremium },
      quiz_score
    )) as { delta: number; new_cgpa: number; unlocked_essay_mode: boolean; debug: any }

    const serverCalculatedCGPA = gpaResult.new_cgpa

    // 5. Security Guard: Reject mismatched client-submitted GPA
    if (
      typeof client_expected_cgpa === 'number' &&
      Math.abs(client_expected_cgpa - serverCalculatedCGPA) > 0.01
    ) {
      return NextResponse.json(
        {
          error: 'Mismatched client-submitted GPA calculation.',
          client_expected_cgpa,
          server_calculated_cgpa: serverCalculatedCGPA,
        },
        { status: 400 }
      )
    }

    // 6. Compute Gamification Class Title & Badges
    const newTitle = GamificationEngine.getClassTitle(serverCalculatedCGPA)
    const badges = GamificationEngine.evaluateBadges({
      cgpa: serverCalculatedCGPA,
      is_premium: isPremium,
    })

    // 7. Persist updated CGPA and leaderboard score via secure admin client
    const adminSupabase = createAdminClient()

    await adminSupabase
      .from('users')
      .update({ cgpa: serverCalculatedCGPA })
      .eq('id', user.id)

    // 8. Upsert leaderboard score
    const leaderboardScore = serverCalculatedCGPA * 100.0 // Convert 0-10 CGPA to 0-1000 leaderboard score scale

    const { error: lbError } = await adminSupabase.from('leaderboard').upsert(
      {
        user_id: user.id,
        display_name: displayName,
        score: leaderboardScore,
        period: 'all-time',
      },
      { onConflict: 'user_id,period' }
    )

    if (lbError) {
      console.error('[Leaderboard Submit] Upsert error:', lbError)
    }

    return NextResponse.json({
      success: true,
      previous_cgpa: currentCGPA,
      new_cgpa: serverCalculatedCGPA,
      cgpa_delta: gpaResult.delta,
      class_title: newTitle,
      badges,
      unlocked_essay_mode: gpaResult.unlocked_essay_mode,
    })
  } catch (err: any) {
    console.error('[Leaderboard Submit Handler Error]:', err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
