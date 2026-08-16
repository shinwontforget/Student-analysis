import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
      session_id,
      answers, // Record<string, 'A' | 'B' | 'C' | 'D'> — client-submitted answers per question id
    }: { subject: string; session_id?: string; answers?: Record<string, string> } = body

    const adminSupabase = createAdminClient()

    // ── Server-Side Session Verification ──────────────────────────────────────
    // If a session_id was provided, verify it and calculate the score server-side.
    // This prevents clients from spoofing correctAnswers.
    let correctAnswers: number
    let totalQuestions: number

    if (session_id && answers && typeof answers === 'object') {
      // 1. Fetch session — must belong to this user, not expired, not already submitted
      const { data: session, error: sessionErr } = await adminSupabase
        .from('quiz_sessions')
        .select('id, user_id, questions, expires_at, submitted_at')
        .eq('id', session_id)
        .eq('user_id', user.id)
        .single()

      if (sessionErr || !session) {
        return NextResponse.json(
          { error: 'Invalid or expired quiz session. Please start a new quiz.' },
          { status: 404 }
        )
      }

      if (session.submitted_at) {
        return NextResponse.json(
          { error: 'This quiz session has already been submitted.' },
          { status: 409 }
        )
      }

      if (new Date(session.expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'Quiz session has expired. Please start a new quiz.' },
          { status: 410 }
        )
      }

      // 2. Re-calculate correct count from server-stored correctAnswer values
      const storedQuestions: Array<{ id: string; correctAnswer: string }> = session.questions
      totalQuestions = storedQuestions.length

      correctAnswers = storedQuestions.reduce((count, q) => {
        const clientAnswer = answers[q.id]
        return count + (clientAnswer === q.correctAnswer ? 1 : 0)
      }, 0)

      // 3. Mark session as submitted (idempotency guard)
      await adminSupabase
        .from('quiz_sessions')
        .update({ submitted_at: new Date().toISOString() })
        .eq('id', session_id)

    } else {
      // Legacy path: no session — apply strict bounds but accept client numbers
      // This supports older clients; log a warning so we can eventually phase it out
      console.warn('[quiz/submit] No session_id provided — falling back to client-reported score for user:', user.id)

      const rawCorrect = Number(body.correctAnswers)
      const rawTotal = Number(body.totalQuestions)

      if (
        !Number.isInteger(rawCorrect) ||
        !Number.isInteger(rawTotal) ||
        rawTotal <= 0 ||
        rawTotal > 50 ||
        rawCorrect < 0 ||
        rawCorrect > rawTotal
      ) {
        return NextResponse.json(
          { error: 'Invalid quiz score parameters. totalQuestions must be 1-50 and correctAnswers must not exceed totalQuestions.' },
          { status: 400 }
        )
      }

      correctAnswers = rawCorrect
      totalQuestions = rawTotal
    }

    const safeCorrect = Math.min(totalQuestions, Math.max(0, Math.floor(correctAnswers)))
    const safeTotal = Math.max(1, Math.min(50, Math.floor(totalQuestions)))
    const scorePct = Math.round((safeCorrect / safeTotal) * 100)

    // Get current CGPA
    const { data: profile } = await supabase
      .from('users')
      .select('cgpa')
      .eq('id', user.id)
      .single()

    const currentCgpa = profile?.cgpa ?? 5.0
    const cgpaDelta = computeCgpaDelta(currentCgpa, scorePct, safeTotal)

    // Save quiz attempt
    await adminSupabase.from('quiz_attempts').insert({
      user_id: user.id,
      subject,
      questions_total: safeTotal,
      correct_answers: safeCorrect,
      score_pct: scorePct,
      cgpa_delta: cgpaDelta,
      attempted_at: new Date().toISOString(),
    })

    return NextResponse.json({
      scorePct,
      correctAnswers: safeCorrect,
      totalQuestions: safeTotal,
      cgpaDelta,
      currentCgpa,
      message: 'Quiz attempt saved! Your CGPA will update at the end of the daily cycle based on your full day performance.',
    })
  } catch (err: any) {
    console.error('[/api/quiz/submit]', err)
    return NextResponse.json({ error: 'Failed to submit quiz. Please try again.' }, { status: 500 })
  }
}
