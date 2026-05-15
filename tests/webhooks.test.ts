import { describe, it, expect } from "vitest";
import { verifyWebhook } from "../src/webhooks";

describe("Webhook verification", () => {
  const SECRET = "whsec_test_secret_key_for_verification";

  it("returns true for valid signature", async () => {
    const payload = JSON.stringify({ event: "quote.update", data: { symbol: "AAPL" } });
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Compute expected signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureData = encoder.encode(`${timestamp}.${payload}`);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, signatureData);
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const result = await verifyWebhook({
      payload,
      signature,
      timestamp,
      secret: SECRET,
    });
    expect(result).toBe(true);
  });

  it("returns false for invalid signature", async () => {
    const result = await verifyWebhook({
      payload: '{"event": "test"}',
      signature: "invalid_hex_signature_that_is_not_real",
      timestamp: "1715800000",
      secret: SECRET,
    });
    expect(result).toBe(false);
  });

  it("returns false for tampered payload", async () => {
    const payload = '{"event": "quote.update"}';
    const timestamp = "1715800000";

    // Sign with correct payload
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureData = encoder.encode(`${timestamp}.${payload}`);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, signatureData);
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Verify with tampered payload
    const result = await verifyWebhook({
      payload: '{"event": "quote.delete"}',
      signature,
      timestamp,
      secret: SECRET,
    });
    expect(result).toBe(false);
  });

  it("rejects replayed signatures with expired timestamps", async () => {
    const payload = JSON.stringify({ event: "quote.update", data: { symbol: "AAPL" } });
    // Timestamp from 10 minutes ago (exceeds 5 min tolerance)
    const expiredTimestamp = (Math.floor(Date.now() / 1000) - 600).toString();

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureData = encoder.encode(`${expiredTimestamp}.${payload}`);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, signatureData);
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const result = await verifyWebhook({
      payload,
      signature,
      timestamp: expiredTimestamp,
      secret: SECRET,
    });
    // Should reject due to expired timestamp (replay attack prevention)
    expect(result).toBe(false);
  });
});
