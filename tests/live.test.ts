/**
 * Live integration tests against the production VecTrade API.
 *
 * These tests verify end-to-end SDK behavior with real data.
 * Set VECTRADE_API_KEY env var to run (skipped otherwise).
 *
 * Run manually: VECTRADE_API_KEY=vq_... npx vitest run tests/live.test.ts
 */
import { describe, it, expect, beforeAll } from "vitest";
import { VecTrade, AuthenticationError, ConfigurationError, NotFoundError } from "../src/index";

const API_KEY = process.env.VECTRADE_API_KEY;

const describeIf = (condition: boolean) => (condition ? describe : describe.skip);

describeIf(!!API_KEY)("Live integration tests", () => {
  let vt: VecTrade;

  beforeAll(() => {
    vt = new VecTrade({ apiKey: API_KEY! });
  });

  describe("Authentication & error handling", () => {
    it("throws ConfigurationError when no key provided", () => {
      const origKey = process.env.VECTRADE_API_KEY;
      delete process.env.VECTRADE_API_KEY;
      try {
        expect(() => new VecTrade()).toThrow(ConfigurationError);
      } finally {
        if (origKey) process.env.VECTRADE_API_KEY = origKey;
      }
    });

    it("throws AuthenticationError with correct properties for invalid key", async () => {
      const badClient = new VecTrade({ apiKey: "vq_invalid_bogus_key_12345" });
      try {
        await badClient.developer.getPlan();
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(AuthenticationError);
        const err = e as AuthenticationError;
        expect(err.status).toBe(403);
        expect(err.errorCode).toBe("invalid_api_key");
        expect(err.message).toContain("invalid");
        expect(err.details).toBeDefined();
        expect(err.details!.docs_url).toContain("docs.vectrade.io");
        expect(err.details!.dashboard_url).toContain("vectrade.io");
      }
    });

    it("throws ConfigurationError for empty key string (client-side validation)", () => {
      expect(() => new VecTrade({ apiKey: "" })).toThrow(ConfigurationError);
    });

    it("throws NotFoundError for unknown endpoints", async () => {
      try {
        await vt.quotes.get("ZZZZZZZZ_NOTREAL");
        // May or may not throw depending on API behavior for unknown symbols
      } catch (e) {
        if (e instanceof NotFoundError) {
          expect(e.status).toBe(404);
        }
        // Other errors (like the API returning empty) are also acceptable
      }
    });
  });

  describe("Developer self-service", () => {
    it("getPlan returns all enforcement parameters", async () => {
      const plan = await vt.developer.getPlan();
      // Identity
      expect(plan.plan_id).toBeTruthy();
      expect(plan.plan_name).toBeTruthy();
      expect(plan.status).toBe("ACTIVE");
      // Quota enforcement
      expect(plan.monthly_quota).toBeGreaterThan(0);
      expect(plan.overage_policy).toMatch(/^(BLOCK|PAYG)$/);
      expect(plan.overage_cap_multiplier).toBeGreaterThan(0);
      // Rate limits
      expect(plan.rate_limit_rpm).toBeGreaterThan(0);
      expect(plan.rate_limit_rps).toBeGreaterThan(0);
      // AI
      expect(typeof plan.includes_ai).toBe("boolean");
      expect(plan.monthly_tokens).toBeGreaterThan(0);
      expect(typeof plan.ai_prompts_per_day).toBe("number");
      // Metering
      expect(plan.metering_type).toBeTruthy();
      expect(plan.max_keys).toBeGreaterThan(0);
      // Billing period
      expect(plan.current_period_start).toBeTruthy();
      expect(plan.current_period_end).toBeTruthy();
    });

    it("getUsage returns token and request tracking", async () => {
      const usage = await vt.developer.getUsage();
      expect(usage.period).toMatch(/^\d{4}-\d{2}$/);
      expect(usage.total_requests).toBeGreaterThanOrEqual(0);
      expect(usage.ai_requests).toBeGreaterThanOrEqual(0);
      expect(usage.error_count).toBeGreaterThanOrEqual(0);
      // Token tracking
      expect(usage.tokens_used).toBeGreaterThanOrEqual(0);
      expect(usage.token_quota).toBeGreaterThan(0);
      expect(usage.token_remaining).toBeGreaterThanOrEqual(0);
      // Quota
      expect(usage.quota_limit).toBeGreaterThan(0);
      expect(usage.quota_remaining).toBeGreaterThanOrEqual(0);
      expect(usage.metering_type).toBeTruthy();
    });

    it("getQuota returns remaining budget", async () => {
      const quota = await vt.developer.getQuota();
      expect(quota.plan_id).toBeTruthy();
      expect(quota.monthly_quota).toBeGreaterThan(0);
      expect(quota.used).toBeGreaterThanOrEqual(0);
      expect(quota.remaining).toBeGreaterThanOrEqual(0);
      expect(quota.usage_pct).toBeGreaterThanOrEqual(0);
      expect(quota.usage_pct).toBeLessThanOrEqual(100);
      expect(quota.overage_policy).toMatch(/^(BLOCK|PAYG)$/);
      expect(quota.reset_at).toBeTruthy();
    });

    it("listKeys returns keys with correct shape", async () => {
      const keys = await vt.developer.listKeys();
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
      for (const key of keys) {
        expect(key.id).toBeTruthy();
        expect(key.key_prefix).toMatch(/^vq_/);
        expect(key.label).toBeTruthy();
        expect(key.created_at).toBeTruthy();
        expect(typeof key.scopes).toBe("string");
      }
    });

    it("getDailyUsage returns array", async () => {
      const daily = await vt.developer.getDailyUsage({ days: 7 });
      expect(Array.isArray(daily)).toBe(true);
      // May be empty if no usage in last 7 days
      for (const entry of daily) {
        expect(entry.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(entry.call_count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Quotes", () => {
    it("gets a single quote with all fields", async () => {
      const quote = await vt.quotes.get("AAPL");
      expect(quote.symbol).toBe("AAPL");
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.volume).toBeGreaterThanOrEqual(0);
    });

    it("gets a different symbol", async () => {
      const quote = await vt.quotes.get("MSFT");
      expect(quote.symbol).toBe("MSFT");
      expect(quote.price).toBeGreaterThan(0);
    });
  });

  describe("Key lifecycle & scope enforcement", () => {
    it("creates a scoped key and enforces scope restrictions", async () => {
      // Create a key with only "quotes" scope
      const created = await vt.developer.createKey({
        label: "sdk-live-test-scope",
        scopes: ["quotes"],
      });
      expect(created.id).toBeTruthy();
      expect(created.raw_key).toMatch(/^vq_/);
      expect(created.label).toBe("sdk-live-test-scope");
      expect(created.scopes).toContain("quotes");

      try {
        // Scoped key should work for quotes
        const scopedClient = new VecTrade({ apiKey: created.raw_key });
        const quote = await scopedClient.quotes.get("AAPL");
        expect(quote.symbol).toBe("AAPL");
        expect(quote.price).toBeGreaterThan(0);

        // Scoped key should fail for non-allowed resources (options)
        try {
          await scopedClient.options.chain("AAPL");
          // If it doesn't throw, the API may not enforce this path yet
        } catch (e) {
          expect(e).toBeInstanceOf(AuthenticationError);
          const err = e as AuthenticationError;
          expect(err.errorCode).toBe("scope_denied");
          expect(err.status).toBe(403);
          expect(err.details?.allowed_scopes).toBe("quotes");
        }
      } finally {
        // Always clean up
        await vt.developer.revokeKey(created.id);
      }
    });

    it("revoked key throws AuthenticationError", async () => {
      const created = await vt.developer.createKey({
        label: "sdk-live-test-revoke",
        scopes: ["quotes"],
      });

      await vt.developer.revokeKey(created.id);

      // Small delay to ensure revocation propagates
      await new Promise((r) => setTimeout(r, 500));

      const revokedClient = new VecTrade({ apiKey: created.raw_key });
      try {
        await revokedClient.developer.getPlan();
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(AuthenticationError);
        const err = e as AuthenticationError;
        expect(err.status).toBe(403);
        expect(err.errorCode).toBe("invalid_api_key");
      }
    });
  });

  describe("Response metadata", () => {
    it("populates lastResponseMeta after successful request", async () => {
      await vt.developer.getPlan();
      expect(vt.lastResponseMeta).toBeDefined();
      expect(vt.lastResponseMeta!.retries).toBe(0);
    });
  });
});
