/**
 * Offline plan tier defaults — used as client-side hints before the first API call.
 * Mirrors the server-side plan definitions for validation and UI display.
 */

export interface PlanDefaults {
  plan_id: string;
  plan_name: string;
  monthly_quota: number;
  rate_limit_rpm: number;
  rate_limit_rps: number;
  max_keys: number;
  includes_ai: boolean;
  monthly_tokens: number;
  ai_prompts_per_day: number;
  metering_type: string;
  overage_policy: "BLOCK" | "PAYG";
  overage_cap_multiplier: number;
  monthly_price_usd: number;
}

export const DEFAULT_TIERS: Record<string, PlanDefaults> = {
  free: {
    plan_id: "free",
    plan_name: "Free",
    monthly_quota: 10_000,
    rate_limit_rpm: 20,
    rate_limit_rps: 2,
    max_keys: 1,
    includes_ai: false,
    monthly_tokens: 0,
    ai_prompts_per_day: 0,
    metering_type: "request",
    overage_policy: "BLOCK",
    overage_cap_multiplier: 1.0,
    monthly_price_usd: 0,
  },
  standard: {
    plan_id: "standard",
    plan_name: "Standard",
    monthly_quota: 100_000,
    rate_limit_rpm: 120,
    rate_limit_rps: 10,
    max_keys: 5,
    includes_ai: true,
    monthly_tokens: 1_000_000,
    ai_prompts_per_day: -1, // unlimited
    metering_type: "token",
    overage_policy: "PAYG",
    overage_cap_multiplier: 2.0,
    monthly_price_usd: 19,
  },
  professional: {
    plan_id: "professional",
    plan_name: "Professional",
    monthly_quota: 500_000,
    rate_limit_rpm: 300,
    rate_limit_rps: 25,
    max_keys: 20,
    includes_ai: true,
    monthly_tokens: 5_000_000,
    ai_prompts_per_day: -1, // unlimited
    metering_type: "token",
    overage_policy: "PAYG",
    overage_cap_multiplier: 3.0,
    monthly_price_usd: 49,
  },
};

/**
 * Get default tier config by plan name (case-insensitive).
 * @throws {Error} if plan name is not a recognized tier.
 */
export function getDefaultTier(planName: string): PlanDefaults {
  const tier = DEFAULT_TIERS[planName.toLowerCase()];
  if (!tier) {
    throw new Error(`Unknown plan tier: ${planName}`);
  }
  return tier;
}
