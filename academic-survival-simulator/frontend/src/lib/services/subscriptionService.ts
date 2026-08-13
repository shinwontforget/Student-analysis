import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanById } from '@/lib/config/plans'
import { fetchPythonApi } from '@/lib/pythonService'

/**
 * Checks and synchronizes a user's premium status.
 * Flips `is_premium` to false if `premium_expires_at` has passed.
 * Calls Python backend to re-evaluate unlocked_essay_mode after every status check.
 */
export async function checkAndSyncPremiumStatus(userId: string) {
  const adminSupabase = createAdminClient()

  // Fetch user record
  const { data: user, error: userErr } = await adminSupabase
    .from('users')
    .select('cgpa, is_premium, premium_expires_at')
    .eq('id', userId)
    .single()

  if (userErr || !user) {
    return { is_premium: false, premium_expires_at: null, unlocked_essay_mode: false }
  }

  let isPremium = user.is_premium
  let expiresAt = user.premium_expires_at ? new Date(user.premium_expires_at) : null
  const now = new Date()

  // Expiration check: if premium is active but expiration date is in the past, flip to false
  if (isPremium && expiresAt && expiresAt < now) {
    isPremium = false

    // Update users table
    await adminSupabase
      .from('users')
      .update({ is_premium: false })
      .eq('id', userId)

    // Update subscriptions table status to expired
    await adminSupabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('user_id', userId)
  }

  // Re-evaluate unlocked_essay_mode via Phase 3 Python backend call
  const pythonEval = await fetchPythonApi<{ unlocked_essay_mode: boolean }>(
    '/api/v1/analytics/calculate-gpa',
    {
      method: 'POST',
      body: JSON.stringify({
        cgpa: user.cgpa ?? 0.0,
        is_premium: isPremium,
        quiz_score: 0.0, // dummy score just to evaluate unlock state
      }),
    }
  ).catch(() => ({ unlocked_essay_mode: (user.cgpa ?? 0.0) >= 7.5 || isPremium }))

  return {
    is_premium: isPremium,
    premium_expires_at: expiresAt ? expiresAt.toISOString() : null,
    unlocked_essay_mode: pythonEval.unlocked_essay_mode,
  }
}

/**
 * Applies a premium subscription purchase with duration stacking logic.
 * If currently active with a future expiration date, stacks the new plan duration on top.
 * Otherwise, sets expiry from now() + plan duration.
 */
export async function applyPremiumSubscription(
  userId: string,
  planId: string,
  razorpayOrderId?: string,
  razorpayPaymentId?: string
) {
  const plan = getPlanById(planId)
  if (!plan) {
    throw new Error(`[SubscriptionService] Invalid planId: ${planId}`)
  }

  const adminSupabase = createAdminClient()

  // Fetch current user premium status
  const { data: user, error: userErr } = await adminSupabase
    .from('users')
    .select('cgpa, is_premium, premium_expires_at')
    .eq('id', userId)
    .single()

  if (userErr || !user) {
    throw new Error(`[SubscriptionService] User not found: ${userId}`)
  }

  const now = new Date()
  let baseDate = now

  // Stacking Logic: If premium is currently active and premium_expires_at > now(), stack on top!
  if (user.is_premium && user.premium_expires_at) {
    const currentExpiry = new Date(user.premium_expires_at)
    if (currentExpiry > now) {
      baseDate = currentExpiry
    }
  }

  // Calculate new stacked expiration date
  const newExpiresAt = new Date(
    baseDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000
  )

  // 1. Update users table
  await adminSupabase
    .from('users')
    .update({
      is_premium: true,
      premium_expires_at: newExpiresAt.toISOString(),
    })
    .eq('id', userId)

  // 2. Upsert subscriptions table (service_role only policy enforced)
  const { error: subErr } = await adminSupabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        plan: plan.id,
        status: 'active',
        razorpay_sub_id: razorpayOrderId || `ord_${Date.now()}`,
        razorpay_plan_id: razorpayPaymentId || plan.id,
        valid_until: newExpiresAt.toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (subErr) {
    console.error('[SubscriptionService] Subscriptions table upsert error:', subErr)
  }

  // 3. Re-evaluate unlocked_essay_mode via Python backend
  const pythonEval = await fetchPythonApi<{ unlocked_essay_mode: boolean }>(
    '/api/v1/analytics/calculate-gpa',
    {
      method: 'POST',
      body: JSON.stringify({
        cgpa: user.cgpa ?? 0.0,
        is_premium: true,
        quiz_score: 0.0,
      }),
    }
  ).catch(() => ({ unlocked_essay_mode: true }))

  return {
    is_premium: true,
    premium_expires_at: newExpiresAt.toISOString(),
    unlocked_essay_mode: pythonEval.unlocked_essay_mode,
  }
}

/**
 * Manually cancels a user's premium status.
 */
export async function cancelPremiumSubscription(userId: string) {
  const adminSupabase = createAdminClient()

  // Fetch current user CGPA
  const { data: user } = await adminSupabase
    .from('users')
    .select('cgpa')
    .eq('id', userId)
    .single()

  const currentCGPA = user?.cgpa ?? 0.0

  // Update users table
  await adminSupabase
    .from('users')
    .update({
      is_premium: false,
      premium_expires_at: null,
    })
    .eq('id', userId)

  // Update subscriptions table
  await adminSupabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)

  // Re-evaluate unlocked_essay_mode via Python backend
  const pythonEval = await fetchPythonApi<{ unlocked_essay_mode: boolean }>(
    '/api/v1/analytics/calculate-gpa',
    {
      method: 'POST',
      body: JSON.stringify({
        cgpa: currentCGPA,
        is_premium: false,
        quiz_score: 0.0,
      }),
    }
  ).catch(() => ({ unlocked_essay_mode: currentCGPA >= 7.5 }))

  return {
    is_premium: false,
    premium_expires_at: null,
    unlocked_essay_mode: pythonEval.unlocked_essay_mode,
  }
}
