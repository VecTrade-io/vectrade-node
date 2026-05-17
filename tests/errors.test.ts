import { describe, it, expect } from "vitest";
import {
  VecTradeError,
  ConfigurationError,
  APIError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ValidationError,
  QuotaExceededError,
  ServerError,
} from "../src/errors";

describe("Error classes", () => {
  describe("VecTradeError", () => {
    it("is an instance of Error", () => {
      const err = new VecTradeError("test");
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("test");
      expect(err.name).toBe("VecTradeError");
    });

    it("carries requestId", () => {
      const err = new VecTradeError("test", { requestId: "req_123" });
      expect(err.requestId).toBe("req_123");
    });
  });

  describe("ConfigurationError", () => {
    it("inherits from VecTradeError", () => {
      const err = new ConfigurationError("bad config");
      expect(err).toBeInstanceOf(VecTradeError);
      expect(err.name).toBe("ConfigurationError");
    });
  });

  describe("APIError", () => {
    it("carries status code", () => {
      const err = new APIError("not found", { status: 404, requestId: "req_456" });
      expect(err).toBeInstanceOf(VecTradeError);
      expect(err.status).toBe(404);
      expect(err.requestId).toBe("req_456");
      expect(err.name).toBe("APIError");
    });
  });

  describe("AuthenticationError", () => {
    it("inherits from APIError", () => {
      const err = new AuthenticationError("invalid key", { status: 401 });
      expect(err).toBeInstanceOf(APIError);
      expect(err.status).toBe(401);
      expect(err.name).toBe("AuthenticationError");
    });
  });

  describe("RateLimitError", () => {
    it("carries retryAfter", () => {
      const err = new RateLimitError("slow down", { status: 429, retryAfter: 2.5 });
      expect(err).toBeInstanceOf(APIError);
      expect(err.retryAfter).toBe(2.5);
      expect(err.name).toBe("RateLimitError");
    });

    it("retryAfter is optional", () => {
      const err = new RateLimitError("slow down", { status: 429 });
      expect(err.retryAfter).toBeUndefined();
    });
  });

  describe("NotFoundError", () => {
    it("inherits from APIError with status 404", () => {
      const err = new NotFoundError("resource not found", { status: 404, requestId: "req_nf" });
      expect(err).toBeInstanceOf(APIError);
      expect(err.status).toBe(404);
      expect(err.requestId).toBe("req_nf");
      expect(err.name).toBe("NotFoundError");
    });
  });

  describe("ValidationError", () => {
    it("inherits from APIError with status 422", () => {
      const err = new ValidationError("invalid params", { status: 422, requestId: "req_val" });
      expect(err).toBeInstanceOf(APIError);
      expect(err.status).toBe(422);
      expect(err.name).toBe("ValidationError");
    });
  });

  describe("QuotaExceededError", () => {
    it("inherits from APIError", () => {
      const err = new QuotaExceededError("quota exhausted", { status: 429, requestId: "req_qt" });
      expect(err).toBeInstanceOf(APIError);
      expect(err.status).toBe(429);
      expect(err.name).toBe("QuotaExceededError");
    });
  });

  describe("ServerError", () => {
    it("inherits from APIError with 5xx status", () => {
      const err = new ServerError("internal error", { status: 500, requestId: "req_srv" });
      expect(err).toBeInstanceOf(APIError);
      expect(err.status).toBe(500);
      expect(err.name).toBe("ServerError");
    });

    it("works with 503 status", () => {
      const err = new ServerError("service unavailable", { status: 503 });
      expect(err.status).toBe(503);
    });
  });

  describe("toJSON()", () => {
    it("serializes VecTradeError", () => {
      const err = new VecTradeError("base error", { requestId: "req_json" });
      const json = err.toJSON();
      expect(json).toEqual({
        name: "VecTradeError",
        message: "base error",
        requestId: "req_json",
      });
    });

    it("serializes APIError with status and errorCode", () => {
      const err = new APIError("rate limited", {
        status: 429,
        requestId: "req_rl",
        errorCode: "RL_001",
        details: { limit: 100 },
      });
      const json = err.toJSON();
      expect(json.name).toBe("APIError");
      expect(json.status).toBe(429);
      expect(json.errorCode).toBe("RL_001");
      expect(json.details).toEqual({ limit: 100 });
      expect(json.requestId).toBe("req_rl");
    });

    it("is JSON.stringify compatible", () => {
      const err = new APIError("test", { status: 500 });
      const serialized = JSON.stringify(err);
      const parsed = JSON.parse(serialized);
      expect(parsed.name).toBe("APIError");
      expect(parsed.status).toBe(500);
    });
  });
});
