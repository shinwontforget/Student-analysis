import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { applyPremiumSubscription } from '@/lib/services/subscriptionService'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder'

    // 1. Verify Razorpay HMAC signature server-side
    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex')

      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: 'Invalid Razorpay HMAC signature' },
          { status: 400 }
        )
      }
    }

    // 2. Parse event payload
    const event = JSON.parse(rawBody)
    const { event: eventName, payload } = event

    // 3. Process payment.captured or order.paid events
    if (eventName === 'payment.captured' || eventName === 'order.paid') {
      const paymentEntity = payload.payment?.entity || payload.order?.entity
      const notes = paymentEntity?.notes || {}
      const userId = notes.user_id
      const planId = notes.plan_id || 'monthly'

      if (userId) {
        // Apply premium status with duration stacking logic & Python backend re-evaluation
        const result = await applyPremiumSubscription(
          userId,
          planId,
          paymentEntity.order_id || paymentEntity.id,
          paymentEntity.id
        )

        return NextResponse.json({
          status: 'success',
          user_id: userId,
          plan_id: planId,
          is_premium: result.is_premium,
          premium_expires_at: result.premium_expires_at,
          unlocked_essay_mode: result.unlocked_essay_mode,
        })
      }
    }

    // Handle client checkout verification fallback payload format:
    // { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, plan_id }
    if (event.razorpay_order_id && event.razorpay_payment_id && event.user_id) {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${event.razorpay_order_id}|${event.razorpay_payment_id}`)
        .digest('hex')

      if (event.razorpay_signature && event.razorpay_signature !== generatedSignature) {
        return NextResponse.json(
          { error: 'Invalid payment signature' },
          { status: 400 }
        )
      }

      const result = await applyPremiumSubscription(
        event.user_id,
        event.plan_id || 'monthly',
        event.razorpay_order_id,
        event.razorpay_payment_id
      )

      return NextResponse.json({
        status: 'success',
        user_id: event.user_id,
        is_premium: result.is_premium,
        premium_expires_at: result.premium_expires_at,
        unlocked_essay_mode: result.unlocked_essay_mode,
      })
    }

    return NextResponse.json({ status: 'ignored', message: `Event ${eventName} logged` })
  } catch (err: any) {
    console.error('[Webhook Handler Error]:', err)
    return NextResponse.json(
      { error: err.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
