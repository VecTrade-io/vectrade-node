import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { VecTrade } from "../src/client";
import { ConfigurationError } from "../src/errors";

describe("VecTrade Client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.VECTRADE_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("initialization", () => {
    it("throws ConfigurationError when no API key is provided", () => {
      expect(() => new VecTrade()).toThrow(ConfigurationError);
      expect(() => new VecTrade()).toThrow("apiKey is required");
    });

    it("reads API key from environment variable", () => {
      process.env.VECTRADE_API_KEY = "vq_test_from_env_12345";
      const client = new VecTrade();
      expect(client.apiKey).toBe("vq_test_from_env_12345");
    });

    it("explicit apiKey overrides environment", () => {
      process.env.VECTRADE_API_KEY = "vq_test_env_key12345";
      const client = new VecTrade({ apiKey: "vq_test_explicit_key" });
      expect(client.apiKey).toBe("vq_test_explicit_key");
    });

    it("uses production URL by default", () => {
      const client = new VecTrade({ apiKey: "vq_test_key12345678" });
      expect(client.baseURL).toBe("https://api.vectrade.io/v1");
    });

    it("uses sandbox URL when sandbox=true", () => {
      const client = new VecTrade({ apiKey: "vq_test_key12345678", sandbox: true });
      expect(client.baseURL).toBe("https://sandbox.vectrade.io/api/v1");
    });

    it("respects custom baseURL", () => {
      const client = new VecTrade({
        apiKey: "vq_test_key12345678",
        baseURL: "https://custom.api.io/v1",
      });
      expect(client.baseURL).toBe("https://custom.api.io/v1");
    });

    it("sets default timeout to 30000ms", () => {
      const client = new VecTrade({ apiKey: "vq_test_key12345678" });
      expect(client.timeout).toBe(30_000);
    });

    it("respects custom timeout", () => {
      const client = new VecTrade({ apiKey: "vq_test_key12345678", timeout: 60_000 });
      expect(client.timeout).toBe(60_000);
    });

    it("sets default maxRetries to 2", () => {
      const client = new VecTrade({ apiKey: "vq_test_key12345678" });
      expect(client.maxRetries).toBe(2);
    });
  });

  describe("resource namespaces", () => {
    it("exposes all resource namespaces", () => {
      const client = new VecTrade({ apiKey: "vq_test_key12345678" });
      expect(client.quotes).toBeDefined();
      expect(client.fundamentals).toBeDefined();
      expect(client.technicals).toBeDefined();
      expect(client.news).toBeDefined();
      expect(client.screener).toBeDefined();
      expect(client.ai).toBeDefined();
    });
  });
});
