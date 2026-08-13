import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cancelPremiumSubscription } from '@/lib/services/subscriptionService'

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
        { error: 'Unauthorized: Session required to cancel subscription' },
        { status: 401 }
      )
    }

    // 2. Perform manual cancellation & Python backend re-evaluation of unlocked_essay_mode
    const result = await cancelPremiumSubscription(user.id)

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully.',
      is_premium: result.is_premium,
      premium_expires_at: result.premium_expires_at,
      unlocked_essay_mode: result.unlocked_essay_mode,
    })
  } catch (err: any) {
    console.error('[Subscription Cancel Handler Error]:', err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
