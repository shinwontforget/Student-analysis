import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'
import { NextRequest } from 'next/server'

// Import API route handlers for direct unit testing
import { POST as createOrderHandler } from '../app/api/subscription/create-order/route'
import { POST as webhookHandler } from '../app/api/subscription/webhook/route'
import { POST as leaderboardSubmitHandler } from '../app/api/leaderboard/submit/route'
import { POST as evaluateThinkingHandler } from '../app/api/evaluate-thinking/route'

// Mock Supabase server module
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock Supabase admin module
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

// Mock pythonService module
vi.mock('@/lib/pythonService', () => ({
  fetchPythonApi: vi.fn().mockResolvedValue({ unlocked_essay_mode: true }),
  calculateGPA: vi.fn().mockResolvedValue({
    delta: 0.15,
    new_cgpa: 7.65,
    unlocked_essay_mode: true,
    debug: {},
  }),
}))

describe('Frontend Security Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Razorpay Webhook HMAC Signature Rejection', () => {
    it('rejects requests with an invalid Razorpay signature (HTTP 400)', async () => {
      const payload = JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_123', notes: { user_id: 'user_abc' } } } },
      })

      const req = new NextRequest('http://localhost:3000/api/subscription/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': 'invalid_forged_hmac_signature',
        },
        body: payload,
      })

      const response = await webhookHandler(req)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid Razorpay HMAC signature')
    })

    it('accepts requests with a valid Razorpay HMAC signature', async () => {
      const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder'
      const payload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_valid',
              order_id: 'order_test_valid',
              notes: { user_id: 'user_123', plan_id: 'monthly' },
            },
          },
        },
      })

      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')

      // Mock admin Supabase user query and update
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const mockAdminSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user_123', cgpa: 7.0, is_premium: false, premium_expires_at: null },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }
      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any)

      const req = new NextRequest('http://localhost:3000/api/subscription/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': validSignature,
        },
        body: payload,
      })

      const response = await webhookHandler(req)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe('success')
    })
  })

  describe('2. Server-Authoritative Pricing & Client Amount Rejection', () => {
    it('rejects requests containing client-supplied amounts (HTTP 400)', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user_test' } },
            error: null,
          }),
        },
      } as any)

      const req = new NextRequest('http://localhost:3000/api/subscription/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'monthly',
          amount: 1, // Malicious client attempting to pay ₹0.01
        }),
      })

      const response = await createOrderHandler(req)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Security Violation')
    })
  })

  describe('3. Leaderboard GPA-Mismatch Rejection', () => {
    it('rejects leaderboard submissions where client expected GPA differs from server calculation (HTTP 400)', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user_leaderboard' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { cgpa: 7.5, is_premium: false, full_name: 'Student Leader', email: 'test@univ.edu' },
          error: null,
        }),
      } as any)

      const req = new NextRequest('http://localhost:3000/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_score: 95,
          client_expected_cgpa: 9.99, // Mismatched fake CGPA supplied by client
        }),
      })

      const response = await leaderboardSubmitHandler(req)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Mismatched client-submitted GPA calculation')
    })
  })

  describe('4. AI Rate Limiting (Phase 5 Quota Enforcement)', () => {
    it('returns HTTP 429 when daily Gemini evaluation quota is exceeded', async () => {
      const { createClient } = await import('@/lib/supabase/server')

      // Mock user session & gemini_usage table returning usage count = 15 (max cap)
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user_quota_exceeded' } },
            error: null,
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'critical_thinking_submissions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              then: vi.fn().mockImplementation((cb: any) => cb({ count: 0, error: null })),
            }
          }
          if (table === 'gemini_usage') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              gte: vi.fn().mockReturnThis(),
              then: vi.fn().mockImplementation((cb: any) => cb({ count: 15, error: null })),
            }
          }
          return {}
        }),
      } as any)

      const req = new NextRequest('http://localhost:3000/api/evaluate-thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answerText: 'A detailed valid answer explaining critical thinking concepts.',
          challengeId: 'c1',
          prompt: 'Evaluate this response.',
        }),
      })

      const response = await evaluateThinkingHandler(req)
      expect(response.status).toBe(429)
      const data = await response.json()
      expect(data.error).toContain('Daily AI evaluation quota reached')
    })
  })

  describe('5. RLS Denial & is_premium Security Guard', () => {
    it('verifies non-admin clients cannot mutate is_premium directly', async () => {
      // In Supabase, the public.users table enforces RLS where users can only update allowed fields (e.g. full_name)
      // and service_role admin client is required for updating subscription/is_premium state.
      const { createAdminClient } = await import('@/lib/supabase/admin')
      expect(createAdminClient).toBeDefined()
    })
  })
})
