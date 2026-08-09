import { describe, it, expect, beforeEach } from 'vitest'
import { GPAEngine, type UserSnapshot } from '../gpaEngine'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Default engine with baseGain = 0.5 (matches the production default). */
let engine: GPAEngine

beforeEach(() => {
  engine = new GPAEngine()
})

/** Shorthand for a non-premium user at a given CGPA. */
const user = (cgpa: number, is_premium = false): UserSnapshot => ({
  cgpa,
  is_premium,
})

// ---------------------------------------------------------------------------
// computeDelta — formula correctness
// ---------------------------------------------------------------------------

describe('GPAEngine.computeDelta', () => {
  // ── CGPA = 0 (fresh user, maximum gain potential) ────────────────────────

  describe('when current CGPA is 0', () => {
    it('returns maximum delta on a perfect quiz score', () => {
      // ΔCGPA = 0.5 × (1 − 0/10)² × (100/100) = 0.5 × 1 × 1 = 0.5
      const { delta, newCGPA } = engine.computeDelta(user(0), 100)
      expect(delta).toBeCloseTo(0.5, 6)
      expect(newCGPA).toBeCloseTo(0.5, 6)
    })

    it('returns half delta on a 50% quiz score', () => {
      // ΔCGPA = 0.5 × 1 × 0.5 = 0.25
      const { delta, newCGPA } = engine.computeDelta(user(0), 50)
      expect(delta).toBeCloseTo(0.25, 6)
      expect(newCGPA).toBeCloseTo(0.25, 6)
    })

    it('returns zero delta on a 0% quiz score', () => {
      const { delta, newCGPA } = engine.computeDelta(user(0), 0)
      expect(delta).toBe(0)
      expect(newCGPA).toBe(0)
    })
  })

  // ── CGPA = 10 (perfect student, no more room to grow) ────────────────────

  describe('when current CGPA is 10', () => {
    it('returns delta = 0 regardless of quiz score (no gain at ceiling)', () => {
      // scalingFactor = (1 − 10/10)² = 0 → delta = 0
      const { delta, newCGPA } = engine.computeDelta(user(10), 100)
      expect(delta).toBe(0)
      expect(newCGPA).toBe(10)
    })

    it('returns delta = 0 even with a 0% quiz score', () => {
      const { delta, newCGPA } = engine.computeDelta(user(10), 0)
      expect(delta).toBe(0)
      expect(newCGPA).toBe(10)
    })
  })

  // ── Mid-range CGPA — S-curve deceleration ────────────────────────────────

  describe('S-curve deceleration', () => {
    it('gain at CGPA=5 is exactly 25% of gain at CGPA=0 (same quiz score)', () => {
      // scalingFactor at 5 = (1 - 0.5)² = 0.25
      const { delta: deltaAt0 } = engine.computeDelta(user(0), 100)
      const { delta: deltaAt5 } = engine.computeDelta(user(5), 100)
      expect(deltaAt5).toBeCloseTo(deltaAt0 * 0.25, 6)
    })

    it('produces a smaller delta at CGPA=8 than at CGPA=5 for the same score', () => {
      const { delta: deltaAt5 } = engine.computeDelta(user(5), 80)
      const { delta: deltaAt8 } = engine.computeDelta(user(8), 80)
      expect(deltaAt8).toBeLessThan(deltaAt5)
    })

    it('newCGPA is clamped to 10 even if arithmetic would exceed it', () => {
      // Use a huge baseGain to force overflow
      const bigEngine = new GPAEngine(100)
      const { newCGPA } = bigEngine.computeDelta(user(9.99), 100)
      expect(newCGPA).toBeLessThanOrEqual(10)
    })
  })

  // ── Negative / invalid delta guard ───────────────────────────────────────

  describe('negative or invalid deltas', () => {
    it('delta is never negative (quiz score cannot subtract CGPA)', () => {
      // The formula can only produce delta >= 0 for valid inputs.
      // Run it across many scores and CGPA values.
      const cases: [number, number][] = [
        [0, 0], [0, 50], [0, 100],
        [5, 0], [5, 50], [5, 100],
        [10, 0], [10, 100],
      ]
      for (const [cgpa, score] of cases) {
        const { delta } = engine.computeDelta(user(cgpa), score)
        expect(delta).toBeGreaterThanOrEqual(0)
      }
    })

    it('newCGPA is never below the original CGPA', () => {
      const originalCGPA = 6.5
      const { newCGPA } = engine.computeDelta(user(originalCGPA), 30)
      expect(newCGPA).toBeGreaterThanOrEqual(originalCGPA)
    })

    it('throws RangeError when cgpa is negative', () => {
      expect(() => engine.computeDelta(user(-1), 50)).toThrowError(RangeError)
    })

    it('throws RangeError when cgpa exceeds 10', () => {
      expect(() => engine.computeDelta(user(11), 50)).toThrowError(RangeError)
    })

    it('throws RangeError when quizScore is negative', () => {
      expect(() => engine.computeDelta(user(5), -10)).toThrowError(RangeError)
    })

    it('throws RangeError when quizScore exceeds 100', () => {
      expect(() => engine.computeDelta(user(5), 101)).toThrowError(RangeError)
    })
  })

  // ── Custom baseGain ───────────────────────────────────────────────────────

  describe('custom baseGain', () => {
    it('scales delta proportionally to baseGain', () => {
      const engineX1 = new GPAEngine(0.5)
      const engineX2 = new GPAEngine(1.0)
      const { delta: d1 } = engineX1.computeDelta(user(3), 75)
      const { delta: d2 } = engineX2.computeDelta(user(3), 75)
      expect(d2).toBeCloseTo(d1 * 2, 6)
    })

    it('throws RangeError when constructed with baseGain <= 0', () => {
      expect(() => new GPAEngine(0)).toThrowError(RangeError)
      expect(() => new GPAEngine(-1)).toThrowError(RangeError)
    })
  })

  // ── Debug payload ─────────────────────────────────────────────────────────

  describe('debug payload', () => {
    it('includes all expected fields with correct values', () => {
      const { debug } = engine.computeDelta(user(4), 80)
      expect(debug).toMatchObject({
        basGain: 0.5,
        currentCGPA: 4,
        quizScore: 80,
      })
      // scalingFactor = (1 − 4/10)² = 0.36
      expect(debug.scalingFactor).toBeCloseTo(0.36, 6)
    })
  })
})

// ---------------------------------------------------------------------------
// unlockedEssayMode — unlock gate
// ---------------------------------------------------------------------------

describe('GPAEngine.unlockedEssayMode', () => {
  // ── Threshold path ────────────────────────────────────────────────────────

  describe('CGPA threshold unlock (cgpa >= 7.5)', () => {
    it('returns false when cgpa is below 7.5 and user is not premium', () => {
      expect(engine.unlockedEssayMode(user(7.4))).toBe(false)
    })

    it('returns false at exactly cgpa = 7.49 (boundary)', () => {
      expect(engine.unlockedEssayMode(user(7.49))).toBe(false)
    })

    it('returns true at exactly the threshold (cgpa = 7.5)', () => {
      expect(engine.unlockedEssayMode(user(7.5))).toBe(true)
    })

    it('returns true when cgpa is above 7.5', () => {
      expect(engine.unlockedEssayMode(user(8.0))).toBe(true)
      expect(engine.unlockedEssayMode(user(10))).toBe(true)
    })
  })

  // ── Premium path ──────────────────────────────────────────────────────────

  describe('premium bypass (is_premium = true)', () => {
    it('returns true when is_premium is true even at cgpa = 0', () => {
      expect(engine.unlockedEssayMode(user(0, true))).toBe(true)
    })

    it('returns true when is_premium is true below the threshold (cgpa = 5)', () => {
      expect(engine.unlockedEssayMode(user(5, true))).toBe(true)
    })

    it('returns false when is_premium is false and cgpa is below threshold', () => {
      expect(engine.unlockedEssayMode(user(6, false))).toBe(false)
    })
  })

  // ── Both conditions met ───────────────────────────────────────────────────

  describe('when both conditions are true', () => {
    it('returns true when cgpa >= 7.5 AND is_premium = true', () => {
      expect(engine.unlockedEssayMode(user(9, true))).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// Static properties
// ---------------------------------------------------------------------------

describe('GPAEngine static / instance properties', () => {
  it('exposes the correct essay unlock threshold (7.5)', () => {
    expect(GPAEngine.essayUnlockThreshold).toBe(7.5)
  })

  it('exposes the configured baseGain via getter', () => {
    const custom = new GPAEngine(0.8)
    expect(custom.configuredBaseGain).toBe(0.8)
  })
})
