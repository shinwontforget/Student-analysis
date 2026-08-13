/**
 * GamificationEngine
 * ==================
 * Service handling student class titles, achievement badges, and status buffs/debuffs
 * based on CGPA, assessment history, and premium membership.
 */

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
}

export interface StatusEffect {
  id: string
  name: string
  type: 'buff' | 'debuff'
  modifier: number // e.g. +0.10 for +10% gain boost, -0.10 for -10% penalty
  description: string
}

export interface GamificationState {
  classTitle: string
  badges: Badge[]
  statusEffects: StatusEffect[]
}

export class GamificationEngine {
  /**
   * Returns the student's class title based on their current CGPA.
   */
  static getClassTitle(cgpa: number): string {
    if (cgpa < 3.0) return 'Academic Rookie'
    if (cgpa < 6.0) return 'Scholar'
    if (cgpa < 7.5) return "Dean's List Contender"
    if (cgpa < 9.0) return 'Academic Titan'
    return 'Valedictorian Legend'
  }

  /**
   * Evaluates earned badges based on student metrics.
   */
  static evaluateBadges(params: {
    cgpa: number
    is_premium?: boolean
    assessmentCount?: number
    perfectScoresCount?: number
  }): Badge[] {
    const {
      cgpa,
      is_premium = false,
      assessmentCount = 0,
      perfectScoresCount = 0,
    } = params

    const badges: Badge[] = []

    if (assessmentCount >= 1) {
      badges.push({
        id: 'first_steps',
        name: 'First Steps',
        description: 'Completed your first assessment',
        icon: '🎯',
      })
    }

    if (cgpa >= 5.0) {
      badges.push({
        id: 'cgpa_5_club',
        name: 'Halfway There',
        description: 'Achieved a CGPA of 5.0 or higher',
        icon: '⭐',
      })
    }

    if (cgpa >= 7.5 || is_premium) {
      badges.push({
        id: 'essay_mode_unlocked',
        name: 'Essay Mode Pioneer',
        description: 'Unlocked Essay Mode (CGPA ≥ 7.5 or Premium)',
        icon: '📝',
      })
    }

    if (cgpa >= 9.0) {
      badges.push({
        id: 'apex_scholar',
        name: 'Apex Scholar',
        description: 'Reached elite CGPA of 9.0+',
        icon: '👑',
      })
    }

    if (perfectScoresCount >= 1) {
      badges.push({
        id: 'perfect_100',
        name: 'Flawless Execution',
        description: 'Scored 100% on an assessment',
        icon: '🔥',
      })
    }

    return badges
  }

  /**
   * Calculates active status buffs and debuffs.
   */
  static calculateStatusEffects(
    cgpa: number,
    recentScores: number[] = []
  ): StatusEffect[] {
    const effects: StatusEffect[] = []

    // Buff: Academic Momentum (CGPA >= 7.5 OR last 3 scores >= 80%)
    const hasHighStreak =
      recentScores.length >= 3 && recentScores.slice(-3).every((s) => s >= 80)

    if (cgpa >= 7.5 || hasHighStreak) {
      effects.push({
        id: 'academic_momentum',
        name: 'Academic Momentum',
        type: 'buff',
        modifier: 0.1, // +10% gain boost
        description: 'High performance grants +10% CGPA growth momentum',
      })
    }

    // Debuff: Academic Probation Risk (CGPA < 4.0)
    if (cgpa < 4.0) {
      effects.push({
        id: 'probation_risk',
        name: 'Academic Probation Warning',
        type: 'debuff',
        modifier: -0.1, // -10% growth penalty
        description: 'Low CGPA places student at risk of academic probation',
      })
    }

    return effects
  }

  /**
   * Calculates student Energy (%) and Stress (%) levels based on daily sliders.
   * Inputs:
   *  - sleep (0-12 hours)
   *  - study (0-14 hours)
   *  - coffee (0-10 cups)
   *  - gaming (0-10 hours)
   */
  static calculateEnergyStress(inputs: {
    sleep: number
    study: number
    coffee: number
    gaming: number
  }): { energy: number; stress: number } {
    const { sleep, study, coffee, gaming } = inputs

    // 1. Calculate Energy (0 - 100%)
    // Base energy from sleep (8 hours = 60 energy, up to 10h = +10)
    let sleepEnergy = Math.min(70, Math.round((sleep / 8) * 60))
    if (sleep > 8) {
      sleepEnergy = Math.min(70, 60 + (sleep - 8) * 5)
    }

    // Coffee energy boost with crash penalty for >4 cups
    let coffeeEnergy = coffee <= 4 ? coffee * 8 : 32 - (coffee - 4) * 6

    // Study energy cost
    const studyEnergyDrain = study * 4.5

    // Gaming energy impact: moderate (+2/h up to 3h), heavy (-4/h after 3h)
    let gamingEnergy = gaming <= 3 ? gaming * 2 : 6 - (gaming - 3) * 4

    let totalEnergy = sleepEnergy + coffeeEnergy - studyEnergyDrain + gamingEnergy
    const energy = Math.max(0, Math.min(100, Math.round(totalEnergy)))

    // 2. Calculate Stress (0 - 100%)
    let baseStress = 15

    // Study load adds stress
    const studyStress = study * 6.5

    // Sleep deficit adds stress
    const sleepDeficitStress = sleep < 7 ? (7 - sleep) * 8.5 : 0

    // Coffee jitters (>3 cups adds stress)
    const coffeeJittersStress = coffee > 3 ? (coffee - 3) * 7.5 : 0

    // Gaming stress relief (up to 3h reduces stress, >4h adds stress)
    let gamingStress = 0
    if (gaming <= 3) {
      gamingStress = -gaming * 5.5
    } else {
      gamingStress = -16.5 + (gaming - 3) * 8
    }

    let totalStress = baseStress + studyStress + sleepDeficitStress + coffeeJittersStress + gamingStress
    const stress = Math.max(0, Math.min(100, Math.round(totalStress)))

    return { energy, stress }
  }

  /**
   * Full gamification profile snapshot.
   */
  static getGamificationState(params: {
    cgpa: number
    is_premium?: boolean
    assessmentCount?: number
    perfectScoresCount?: number
    recentScores?: number[]
  }): GamificationState {
    return {
      classTitle: this.getClassTitle(params.cgpa),
      badges: this.evaluateBadges(params),
      statusEffects: this.calculateStatusEffects(
        params.cgpa,
        params.recentScores
      ),
    }
  }
}

