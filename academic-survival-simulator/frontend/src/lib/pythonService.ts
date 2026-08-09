/**
 * Server-only fetch wrapper to communicate securely with the Python FastAPI backend.
 * Uses `import 'server-only'` to guarantee this file is NEVER bundled or imported into client components.
 */
import 'server-only'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || ''

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>
}

/**
 * Makes an authenticated request from the Next.js server to the internal Python FastAPI backend.
 * Automatically attaches the `X-Internal-Secret` header for internal endpoint verification.
 */
export async function fetchPythonApi<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  if (!INTERNAL_API_SECRET) {
    throw new Error(
      '[pythonService] Missing INTERNAL_API_SECRET in environment variables.'
    )
  }

  const url = `${BACKEND_URL.replace(/\/$/, '')}${
    endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  }`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Internal-Secret': INTERNAL_API_SECRET,
    ...(options.headers || {}),
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(
      `[pythonService] Backend request failed (${response.status} ${response.statusText}): ${errorText}`
    )
  }

  return response.json() as Promise<T>
}

/**
 * Helper to calculate GPA delta & new CGPA via the Python backend analytics API.
 */
export async function calculateGPA(user: { cgpa: number; is_premium: boolean }, quizScore: number) {
  return fetchPythonApi('/api/v1/analytics/calculate-gpa', {
    method: 'POST',
    body: JSON.stringify({
      cgpa: user.cgpa,
      is_premium: user.is_premium,
      quiz_score: quizScore,
    }),
  })
}

/**
 * Helper to predict CGPA performance trajectory via the Python backend analytics API.
 */
export async function predictPerformanceTrajectory(assessments: Array<{ date: string; score: number; total: number }>) {
  return fetchPythonApi('/api/v1/analytics/predict-trajectory', {
    method: 'POST',
    body: JSON.stringify({
      assessments,
    }),
  })
}
