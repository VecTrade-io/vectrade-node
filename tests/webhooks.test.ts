import { describe, it, expect } from "vitest";
import { verifyWebhook } from "../src/webhooks";
import { VecTradeError } from "../src/errors";

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

  describe("legacy 3-arg API", () => {
    it("throws VecTradeError when headers are missing", async () => {
      await expect(verifyWebhook("{}", {}, SECRET)).rejects.toBeInstanceOf(VecTradeError);
    });

    it("throws VecTradeError on expired timestamp", async () => {
      const expiredTs = (Math.floor(Date.now() / 1000) - 600).toString();
      const headers = {
        "x-vq-signature": "fake_sig",
        "x-vq-timestamp": expiredTs,
      };
      await expect(verifyWebhook("{}", headers, SECRET)).rejects.toBeInstanceOf(VecTradeError);
    });

    it("throws VecTradeError on invalid signature", async () => {
      const headers = {
        "x-vq-signature": "invalid_hex_signature",
        "x-vq-timestamp": Math.floor(Date.now() / 1000).toString(),
      };
      await expect(verifyWebhook("{}", headers, SECRET)).rejects.toBeInstanceOf(VecTradeError);
    });

    it("returns parsed event on valid signature", async () => {
      const payload = JSON.stringify({
        id: "evt_123",
        type: "quote.alert.triggered",
        data: { symbol: "AAPL" },
        createdAt: "2026-05-17T00:00:00Z",
      });
      const timestamp = Math.floor(Date.now() / 1000).toString();

      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`));
      const signature = Array.from(new Uint8Array(mac))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const headers = {
        "x-vq-signature": signature,
        "x-vq-timestamp": timestamp,
      };
      const event = await verifyWebhook(payload, headers, SECRET);
      expect(event).toHaveProperty("type", "quote.alert.triggered");
      expect(event).toHaveProperty("id", "evt_123");
    });
  });
});
