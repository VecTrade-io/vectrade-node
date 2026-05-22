import { describe, it, expect } from "vitest";
import { DEFAULT_TIERS, getDefaultTier } from "../src/tier-config";

describe("DEFAULT_TIERS", () => {
  it("contains all seed plans", () => {
    expect(Object.keys(DEFAULT_TIERS).sort()).toEqual(["free", "professional", "standard"]);
  });

  it("free is zero cost", () => {
    expect(DEFAULT_TIERS.free.monthly_price_usd).toBe(0);
  });

  it("rate limits increase with tier", () => {
    const order = ["free", "standard", "professional"] as const;
    for (let i = 0; i < order.length - 1; i++) {
      const lower = DEFAULT_TIERS[order[i]];
      const higher = DEFAULT_TIERS[order[i + 1]];
      expect(higher.rate_limit_rpm).toBeGreaterThan(lower.rate_limit_rpm);
      expect(higher.rate_limit_rps).toBeGreaterThan(lower.rate_limit_rps);
    }
  });

  it("quotas increase with tier", () => {
    const order = ["free", "standard", "professional"] as const;
    for (let i = 0; i < order.length - 1; i++) {
      const lower = DEFAULT_TIERS[order[i]];
      const higher = DEFAULT_TIERS[order[i + 1]];
      expect(higher.monthly_quota).toBeGreaterThan(lower.monthly_quota);
      expect(higher.max_keys).toBeGreaterThanOrEqual(lower.max_keys);
    }
  });

  it("free plan blocks overage, paid plans use PAYG", () => {
    expect(DEFAULT_TIERS.free.overage_policy).toBe("BLOCK");
    expect(DEFAULT_TIERS.standard.overage_policy).toBe("PAYG");
    expect(DEFAULT_TIERS.professional.overage_policy).toBe("PAYG");
  });

  it("AI included only on paid plans", () => {
    expect(DEFAULT_TIERS.free.includes_ai).toBe(false);
    expect(DEFAULT_TIERS.standard.includes_ai).toBe(true);
    expect(DEFAULT_TIERS.professional.includes_ai).toBe(true);
  });

  it("tokens increase with tier", () => {
    expect(DEFAULT_TIERS.free.monthly_tokens).toBe(0);
    expect(DEFAULT_TIERS.standard.monthly_tokens).toBe(1_000_000);
    expect(DEFAULT_TIERS.professional.monthly_tokens).toBe(5_000_000);
  });

  it("overage_cap_multiplier increases with tier", () => {
    expect(DEFAULT_TIERS.free.overage_cap_multiplier).toBe(1.0);
    expect(DEFAULT_TIERS.standard.overage_cap_multiplier).toBe(2.0);
    expect(DEFAULT_TIERS.professional.overage_cap_multiplier).toBe(3.0);
  });

  it("professional has correct limits", () => {
    const pro = DEFAULT_TIERS.professional;
    expect(pro.monthly_quota).toBe(500_000);
    expect(pro.rate_limit_rpm).toBe(300);
    expect(pro.rate_limit_rps).toBe(25);
    expect(pro.max_keys).toBe(20);
    expect(pro.monthly_tokens).toBe(5_000_000);
  });
});

describe("getDefaultTier", () => {
  it("returns tier by name", () => {
    const tier = getDefaultTier("professional");
    expect(tier.rate_limit_rpm).toBe(300);
  });

  it("is case-insensitive", () => {
    const tier = getDefaultTier("FREE");
    expect(tier.monthly_quota).toBe(10_000);
  });

  it("throws for unknown tier", () => {
    expect(() => getDefaultTier("platinum")).toThrow("Unknown plan tier: platinum");
  });
});
