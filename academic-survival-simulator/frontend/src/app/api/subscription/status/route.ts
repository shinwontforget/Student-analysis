import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndSyncPremiumStatus } from '@/lib/services/subscriptionService'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Automatically check and sync premium expiration status (flips is_premium to false if expired)
    const status = await checkAndSyncPremiumStatus(user.id)

    return NextResponse.json({
      success: true,
      user_id: user.id,
      ...status,
    })
  } catch (err: any) {
    console.error('[Subscription Status Handler Error]:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
