import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'
import { getPlanById } from '@/lib/config/plans'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: User session required to create order' },
        { status: 401 }
      )
    }

    // 2. Parse request payload
    const body = await request.json().catch(() => ({}))
    const { planId, amount: clientSuppliedAmount } = body

    // Security Guard: Reject any client-supplied amount
    if (clientSuppliedAmount !== undefined) {
      return NextResponse.json(
        { error: 'Security Violation: Client-supplied amounts are strictly forbidden. Price is determined server-side from planId.' },
        { status: 400 }
      )
    }

    if (!planId || typeof planId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid planId' },
        { status: 400 }
      )
    }

    // 3. Server-side lookup of plan amount and duration
    const plan = getPlanById(planId)
    if (!plan) {
      return NextResponse.json(
        { error: `Invalid planId '${planId}'. Must be one of: monthly, quarterly, yearly.` },
        { status: 400 }
      )
    }

    // 4. Initialize Razorpay SDK in Test Mode
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder'

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    // 5. Create Razorpay One-Time Order
    const options = {
      amount: plan.amountInPaise, // Authoritative price from plans.ts
      currency: plan.currency,
      receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan_id: plan.id,
        duration_days: plan.durationDays,
      },
    }

    const order = await razorpay.orders.create(options)

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan_id: plan.id,
      plan_name: plan.name,
      key_id: keyId,
    })
  } catch (err: any) {
    console.error('[Create Order Handler Error]:', err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
