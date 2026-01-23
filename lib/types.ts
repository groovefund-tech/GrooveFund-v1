// /lib/types.ts
export interface TierInfo {
  name: string
  emoji: string
  color: string
  description: string
}

export interface UserStreak {
  currentMonth: number
  totalSpots: number
  tier: TierInfo | null
  lastContributionMonth: string
}

export interface Member {
  user_id: string
  email: string
  display_name: string
  rank?: number
  effective_points?: number
  referral_code?: string
}