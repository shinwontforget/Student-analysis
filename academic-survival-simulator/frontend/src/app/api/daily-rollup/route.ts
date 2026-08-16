import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Daily Rollup Endpoint
 * 
 * Computes daily performance from quiz attempts, critical thinking submissions, 
 * and daily habits for past un-processed days, then updates the student's official CGPA.
 * 
 * Anything not done on a given day contributes 0 delta.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch user's current profile
    const { data: profile, error: profileErr } = await supabase
      .from('users')
      .select('id, cgpa, last_rollup_date, created_at, semester_start_date')
      .eq('id', user.id)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Determine start date for rollup (yesterday is the latest day we rollup)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let lastRollupStr = profile.last_rollup_date
    if (!lastRollupStr) {
      // If never rolled up, start from user's creation date (or yesterday)
      const createdDate = new Date(profile.created_at || profile.semester_start_date || today)
      lastRollupStr = createdDate.toISOString().split('T')[0]
    }

    // Safety window: clamp rollup range to at most 30 days in the past
    const maxPastWindow = new Date(today)
    maxPastWindow.setDate(maxPastWindow.getDate() - 30)
    const maxPastWindowStr = maxPastWindow.toISOString().split('T')[0]
    if (lastRollupStr < maxPastWindowStr) {
      lastRollupStr = maxPastWindowStr
    }

    // If last rollup is already yesterday or today, nothing to process
    if (lastRollupStr >= yesterdayStr) {
      return NextResponse.json({
        rolledUp: false,
        message: 'CGPA already updated through yesterday.',
        currentCgpa: profile.cgpa,
        lastRollupDate: lastRollupStr,
      })
    }

    // 2. Fetch all quiz attempts since lastRollupStr up to yesterday end
    const { data: quizAttempts } = await supabase
      .from('quiz_attempts')
      .select('cgpa_delta, attempted_at, score_pct')
      .eq('user_id', user.id)
      .gte('attempted_at', `${lastRollupStr}T00:00:00Z`)
      .lte('attempted_at', `${yesterdayStr}T23:59:59Z`)

    // 3. Fetch all critical thinking submissions in the same range
    const { data: ctSubmissions } = await supabase
      .from('critical_thinking_submissions')
      .select('quality_score, uniqueness_score, created_at')
      .eq('user_id', user.id)
      .gte('created_at', `${lastRollupStr}T00:00:00Z`)
      .lte('created_at', `${yesterdayStr}T23:59:59Z`)

    // 4. Fetch daily habit logs in the same range
    const { data: habitLogs } = await supabase
      .from('daily_habit_logs')
      .select('logged_date, energy, stress, study_hrs, sleep_hrs')
      .eq('user_id', user.id)
      .gte('logged_date', lastRollupStr)
      .lte('logged_date', yesterdayStr)

    // Group activities by date string
    const dayMap: Record<string, {
      quizDeltas: number[]
      ctScores: number[]
      habit?: { energy: number; stress: number; study: number; sleep: number }
    }> = {}

    // Generate date sequence from lastRollupStr to yesterdayStr
    const curDate = new Date(lastRollupStr)
    const endDate = new Date(yesterdayStr)
    while (curDate <= endDate) {
      const dStr = curDate.toISOString().split('T')[0]
      dayMap[dStr] = { quizDeltas: [], ctScores: [] }
      curDate.setDate(curDate.getDate() + 1)
    }

    quizAttempts?.forEach((q) => {
      const dStr = new Date(q.attempted_at).toISOString().split('T')[0]
      if (dayMap[dStr]) {
        dayMap[dStr].quizDeltas.push(Number(q.cgpa_delta) || 0)
      }
    })

    ctSubmissions?.forEach((ct) => {
      const dStr = new Date(ct.created_at).toISOString().split('T')[0]
      if (dayMap[dStr]) {
        const totalScore = (ct.quality_score || 0) + (ct.uniqueness_score || 0)
        dayMap[dStr].ctScores.push(totalScore)
      }
    })

    habitLogs?.forEach((h) => {
      if (dayMap[h.logged_date]) {
        dayMap[h.logged_date].habit = {
          energy: h.energy ?? 50,
          stress: h.stress ?? 50,
          study: Number(h.study_hrs) || 0,
          sleep: Number(h.sleep_hrs) || 7,
        }
      }
    })

    let totalAccumulatedDelta = 0
    let daysProcessed = 0

    for (const [dateKey, dayData] of Object.entries(dayMap)) {
      daysProcessed++
      let dayDelta = 0

      // Quiz contribution (average of quiz deltas on that day, or 0 if none)
      if (dayData.quizDeltas.length > 0) {
        const avgQuizDelta = dayData.quizDeltas.reduce((a, b) => a + b, 0) / dayData.quizDeltas.length
        dayDelta += avgQuizDelta
      }

      // Critical thinking contribution (max 200 score -> max 0.05 CGPA bonus)
      if (dayData.ctScores.length > 0) {
        const maxCtScore = Math.max(...dayData.ctScores)
        const ctDelta = (maxCtScore / 200) * 0.05
        dayDelta += ctDelta
      }

      // Habit modifier: consistent study and rest gives slight boost, high stress/burnout gives small penalty
      if (dayData.habit) {
        if (dayData.habit.energy >= 70 && dayData.habit.stress <= 45 && dayData.habit.study >= 5) {
          dayDelta += 0.01 // Consistent high performance bonus
        } else if (dayData.habit.stress >= 85 || dayData.habit.sleep < 4) {
          dayDelta -= 0.01 // Exhaustion penalty
        }
      }

      // If nothing was done on that day, dayDelta is 0
      totalAccumulatedDelta += dayDelta
    }

    const currentCgpa = Number(profile.cgpa) || 3.0
    const newCgpa = Math.max(0, Math.min(10, parseFloat((currentCgpa + totalAccumulatedDelta).toFixed(2))))

    // 5. Update user record with new CGPA and last_rollup_date
    //    Use adminClient to bypass user-scoped RLS so the server can safely write CGPA.
    const adminSupabase = createAdminClient()
    await adminSupabase
      .from('users')
      .update({
        cgpa: newCgpa,
        last_rollup_date: yesterdayStr,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({
      rolledUp: true,
      daysProcessed,
      totalAccumulatedDelta,
      previousCgpa: currentCgpa,
      newCgpa,
      lastRollupDate: yesterdayStr,
    })
  } catch (err: any) {
    console.error('[/api/daily-rollup]', err)
    return NextResponse.json({ error: 'Rollup failed. Please try again later.' }, { status: 500 })
  }
}
