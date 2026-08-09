/**
 * GPAEngine
 * =========
 * Encapsulates all CGPA mutation and unlock logic for the Student Analysis
 * platform. All methods are pure/deterministic — no Supabase calls are made
 * here; the caller is responsible for persisting the returned values.
 *
 * S-curve formula
 * ───────────────
 * ΔCGPA = BaseGain × (1 − CurrentCGPA / 10)² × (QuizScore / 100)
 *
 * This ensures:
 *   • Large gains near CGPA = 0 (lots of room to grow)
 *   • Gains approach 0 as CGPA → 10 (harder to reach the top)
 *   • Score quality still matters at every level
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserSnapshot {
  /** Current CGPA — must be in the range [0, 10]. */
  cgpa: number
  /** Whether the user holds an active premium subscription. */
  is_premium: boolean
}

export interface CGPADelta {
  /** The raw computed change (may be 0 for a perfect CGPA or a 0-score quiz). */
  delta: number
  /** The new CGPA after applying the delta, clamped to [0, 10]. */
  newCGPA: number
  /** Snapshot of the values used in the calculation (useful for debugging / logging). */
  debug: {
    basGain: number
    currentCGPA: number
    quizScore: number
    scalingFactor: number
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum possible CGPA on a 10-point scale. */
const MAX_CGPA = 10

/** CGPA threshold above which Essay Mode unlocks automatically. */
const ESSAY_UNLOCK_THRESHOLD = 7.5

/**
 * Default BaseGain — calibrated so a student at CGPA 0 with a perfect quiz
 * score gains 0.5 CGPA points (i.e. a moderate, meaningful jump).
 *
 * Callers can override this when constructing the engine to tune the curve.
 */
const DEFAULT_BASE_GAIN = 0.5

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class GPAEngine {
  private readonly baseGain: number

  /**
   * @param baseGain - The maximum ΔCGPA achievable from a single quiz at
   *                   CGPA = 0 with a perfect score (default: 0.5).
   */
  constructor(baseGain: number = DEFAULT_BASE_GAIN) {
    if (baseGain <= 0) {
      throw new RangeError(`baseGain must be positive, got ${baseGain}`)
    }
    this.baseGain = baseGain
  }

  // ── Core formula ──────────────────────────────────────────────────────────

  /**
   * Computes the CGPA delta earned from a single quiz result.
   *
   * @param user      - Snapshot of the user's current state.
   * @param quizScore - The score achieved, as a percentage in [0, 100].
   * @returns A {@link CGPADelta} object with the delta and the new clamped CGPA.
   *
   * @throws {RangeError} if `user.cgpa` is outside [0, 10] or `quizScore` is outside [0, 100].
   */
  computeDelta(user: UserSnapshot, quizScore: number): CGPADelta {
    if (user.cgpa < 0 || user.cgpa > MAX_CGPA) {
      throw new RangeError(
        `user.cgpa must be in [0, 10], got ${user.cgpa}`
      )
    }
    if (quizScore < 0 || quizScore > 100) {
      throw new RangeError(
        `quizScore must be in [0, 100], got ${quizScore}`
      )
    }

    // S-curve scaling factor: (1 − CurrentCGPA/10)²
    // At CGPA = 0  → factor = 1.00 (maximum gain)
    // At CGPA = 5  → factor = 0.25 (quarter gain)
    // At CGPA = 10 → factor = 0.00 (no gain — already perfect)
    const scalingFactor = Math.pow(1 - user.cgpa / MAX_CGPA, 2)

    const delta = this.baseGain * scalingFactor * (quizScore / 100)

    const newCGPA = Math.min(MAX_CGPA, Math.max(0, user.cgpa + delta))

    return {
      delta,
      newCGPA: parseFloat(newCGPA.toFixed(4)),
      debug: {
        basGain: this.baseGain,
        currentCGPA: user.cgpa,
        quizScore,
        scalingFactor,
      },
    }
  }

  // ── Unlock gate ───────────────────────────────────────────────────────────

  /**
   * Returns `true` when Essay Mode should be available for this user.
   *
   * Unlock conditions (either is sufficient):
   *   1. `user.cgpa >= 7.5` — organic threshold unlock
   *   2. `user.is_premium === true` — premium subscription bypass
   */
  unlockedEssayMode(user: UserSnapshot): boolean {
    return user.cgpa >= ESSAY_UNLOCK_THRESHOLD || user.is_premium === true
  }

  // ── Convenience getters ───────────────────────────────────────────────────

  /** The BaseGain this engine was constructed with. */
  get configuredBaseGain(): number {
    return this.baseGain
  }

  /** The CGPA threshold above which Essay Mode unlocks. */
  static get essayUnlockThreshold(): number {
    return ESSAY_UNLOCK_THRESHOLD
  }
}
