import { NextResponse } from 'next/server'

/**
 * Razorpay webhook endpoint — DISABLED.
 * Razorpay subscription payments have been removed from this product.
 * This stub exists only to return a clear error if somehow reached.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'This payment endpoint is no longer active.' },
    { status: 410 } // 410 Gone
  )
}
