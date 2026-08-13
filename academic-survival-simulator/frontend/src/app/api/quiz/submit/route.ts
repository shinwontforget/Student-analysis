import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Simplified CGPA delta — quizzes should nudge, not swing.
 * scorePct: 0–100
 * Max change per quiz: ±0.05
 */
function computeCgpaDelta(currentCgpa: number, scorePct: number, _totalQuestions: number): number {
  if (scorePct >= 90) return  0.05
  if (scorePct >= 75) return  0.03
  if (scorePct >= 60) return  0.01
  if (scorePct >= 40) return -0.01
  return -0.02
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      subject = 'General',
      correctAnswers,
      totalQuestions,
    }: { subject: string; correctAnswers: number; totalQuestions: number } = body

    if (typeof correctAnswers !== 'number' || typeof totalQuestions !== 'number') {
      return NextResponse.json({ error: 'correctAnswers and totalQuestions required' }, { status: 400 })
    }

    const scorePct = Math.round((correctAnswers / totalQuestions) * 100)

    // Get current CGPA
    const { data: profile } = await supabase
      .from('users')
      .select('cgpa')
      .eq('id', user.id)
      .single()

    const currentCgpa = profile?.cgpa ?? 5.0
    const cgpaDelta = computeCgpaDelta(currentCgpa, scorePct, totalQuestions)
    const newCgpa = Math.max(0, Math.min(10, parseFloat((currentCgpa + cgpaDelta).toFixed(2))))

    // Save quiz attempt
    await supabase.from('quiz_attempts').insert({
      user_id: user.id,
      subject,
      questions_total: totalQuestions,
      correct_answers: correctAnswers,
      score_pct: scorePct,
      cgpa_delta: cgpaDelta,
      attempted_at: new Date().toISOString(),
    })

    return NextResponse.json({
      scorePct,
      cgpaDelta,
      currentCgpa,
      message: 'Quiz attempt saved! Your CGPA will update at the end of the daily cycle based on your full day performance.',
    })
  } catch (err: any) {
    console.error('[/api/quiz/submit]', err)
    return NextResponse.json({ error: err.message ?? 'Failed to submit quiz' }, { status: 500 })
  }
}
