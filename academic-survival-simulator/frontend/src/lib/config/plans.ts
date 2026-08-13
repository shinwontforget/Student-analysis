/**
 * Subscription Plans Configuration
 * Server-authoritative plan pricing and duration definitions.
 */

export interface PlanConfig {
  id: string
  name: string
  amountInPaise: number // Amount in smallest currency unit (paise)
  amountINR: number // Display amount in INR (₹)
  durationDays: number // Subscription validity duration in days
  currency: string
  description: string
}

export const SUBSCRIPTION_PLANS: Record<string, PlanConfig> = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Pass',
    amountInPaise: 4900, // ₹49
    amountINR: 49,
    durationDays: 30,
    currency: 'INR',
    description: '30 days unlimited access to Essay Mode and premium features',
  },
  quarterly: {
    id: 'quarterly',
    name: 'Quarterly Pass',
    amountInPaise: 6900, // ₹69
    amountINR: 69,
    durationDays: 90,
    currency: 'INR',
    description: '90 days unlimited access with 50%+ savings',
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Pass',
    amountInPaise: 9900, // ₹99
    amountINR: 99,
    durationDays: 365,
    currency: 'INR',
    description: '365 days ultimate academic survival pass',
  },
}

export function getPlanById(planId: string): PlanConfig | null {
  return SUBSCRIPTION_PLANS[planId] || null
}
