import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Import API route handlers for direct unit testing
import { POST as quizSubmitHandler } from '../app/api/quiz/submit/route'
import { GET as leaderboardGetHandler } from '../app/api/leaderboard/route'
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

  describe('1. Quiz Score Validation & Bounds Guard', () => {
    it('rejects submissions where correctAnswers exceeds totalQuestions (HTTP 400)', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user_quiz_attacker' } },
            error: null,
          }),
        },
      } as any)

      const req = new NextRequest('http://localhost:3000/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Operating Systems',
          correctAnswers: 20,
          totalQuestions: 10, // Invalid: correct > total
        }),
      })

      const response = await quizSubmitHandler(req)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid quiz score parameters')
    })
  })

  describe('2. Leaderboard GPA-Mismatch Rejection', () => {
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

  describe('5. Leaderboard Authentication & PII Protection Guard', () => {
    it('rejects unauthenticated requests attempting to view the leaderboard (HTTP 401)', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Session not found'),
          }),
        },
      } as any)

      const req = new NextRequest('http://localhost:3000/api/leaderboard', {
        method: 'GET',
      })

      const response = await leaderboardGetHandler(req)
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Unauthorized')
    })
  })

  describe('6. Server-Side Quiz Session Anti-Spoofing Guard', () => {
    it('rejects quiz submissions with invalid or expired session_id (HTTP 404)', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { createAdminClient } = await import('@/lib/supabase/admin')

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'legit_user' } },
            error: null,
          }),
        },
      } as any)

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('Session not found') }),
        }),
      } as any)

      const req = new NextRequest('http://localhost:3000/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Algorithms',
          session_id: 'fake_or_expired_session_id',
          answers: { q_1: 'A', q_2: 'B' },
        }),
      })

      const response = await quizSubmitHandler(req)
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('Invalid or expired quiz session')
    })
  })
})
