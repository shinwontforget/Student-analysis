import { describe, it, expect } from 'vitest'
import { GamificationEngine } from '../gamificationEngine'

describe('GamificationEngine', () => {
  describe('getClassTitle', () => {
    it('returns Academic Rookie for CGPA < 3.0', () => {
      expect(GamificationEngine.getClassTitle(0.0)).toBe('Academic Rookie')
      expect(GamificationEngine.getClassTitle(2.9)).toBe('Academic Rookie')
    })

    it('returns Scholar for CGPA 3.0 to 5.9', () => {
      expect(GamificationEngine.getClassTitle(3.0)).toBe('Scholar')
      expect(GamificationEngine.getClassTitle(5.9)).toBe('Scholar')
    })

    it("returns Dean's List Contender for CGPA 6.0 to 7.4", () => {
      expect(GamificationEngine.getClassTitle(6.0)).toBe("Dean's List Contender")
      expect(GamificationEngine.getClassTitle(7.4)).toBe("Dean's List Contender")
    })

    it('returns Academic Titan for CGPA 7.5 to 8.9', () => {
      expect(GamificationEngine.getClassTitle(7.5)).toBe('Academic Titan')
      expect(GamificationEngine.getClassTitle(8.9)).toBe('Academic Titan')
    })

    it('returns Valedictorian Legend for CGPA >= 9.0', () => {
      expect(GamificationEngine.getClassTitle(9.0)).toBe('Valedictorian Legend')
      expect(GamificationEngine.getClassTitle(10.0)).toBe('Valedictorian Legend')
    })
  })

  describe('evaluateBadges', () => {
    it('awards first_steps badge on 1+ assessment', () => {
      const badges = GamificationEngine.evaluateBadges({ cgpa: 2.0, assessmentCount: 1 })
      expect(badges.map((b) => b.id)).toContain('first_steps')
    })

    it('awards essay_mode_unlocked badge if CGPA >= 7.5 or is_premium', () => {
      const badgesThreshold = GamificationEngine.evaluateBadges({ cgpa: 7.5 })
      expect(badgesThreshold.map((b) => b.id)).toContain('essay_mode_unlocked')

      const badgesPremium = GamificationEngine.evaluateBadges({ cgpa: 2.0, is_premium: true })
      expect(badgesPremium.map((b) => b.id)).toContain('essay_mode_unlocked')
    })

    it('awards apex_scholar for CGPA >= 9.0', () => {
      const badges = GamificationEngine.evaluateBadges({ cgpa: 9.2 })
      expect(badges.map((b) => b.id)).toContain('apex_scholar')
    })
  })

  describe('calculateStatusEffects', () => {
    it('applies Academic Momentum buff when CGPA >= 7.5', () => {
      const effects = GamificationEngine.calculateStatusEffects(7.6)
      expect(effects.some((e) => e.id === 'academic_momentum')).toBe(true)
    })

    it('applies Probation Warning debuff when CGPA < 4.0', () => {
      const effects = GamificationEngine.calculateStatusEffects(3.5)
      expect(effects.some((e) => e.id === 'probation_risk')).toBe(true)
    })

    it('returns no buff/debuff for normal CGPA (5.5) without streaks', () => {
      const effects = GamificationEngine.calculateStatusEffects(5.5)
      expect(effects).toHaveLength(0)
    })
  })

  describe('calculateEnergyStress', () => {
    it('computes high energy and low stress for optimal habits (8h sleep, 4h study, 2 cups coffee, 2h gaming)', () => {
      const { energy, stress } = GamificationEngine.calculateEnergyStress({
        sleep: 8,
        study: 4,
        coffee: 2,
        gaming: 2,
      })

      expect(energy).toBeGreaterThanOrEqual(60)
      expect(energy).toBeLessThanOrEqual(100)
      expect(stress).toBeGreaterThanOrEqual(0)
      expect(stress).toBeLessThanOrEqual(50)
    })

    it('computes low energy and high stress for zero sleep and high coffee', () => {
      const { energy, stress } = GamificationEngine.calculateEnergyStress({
        sleep: 2,
        study: 10,
        coffee: 8,
        gaming: 6,
      })

      expect(energy).toBeLessThan(40)
      expect(stress).toBeGreaterThan(60)
    })
  })
})

