/** Webhook verification utilities. */

const SIGNATURE_HEADER = "x-vq-signature";
const TIMESTAMP_HEADER = "x-vq-timestamp";
const TOLERANCE_SECONDS = 300; // 5 minutes

export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface VerifyWebhookParams {
  /** Raw request body as string */
  payload: string;
  /** HMAC signature hex string */
  signature: string;
  /** Unix timestamp string */
  timestamp: string;
  /** Webhook signing secret */
  secret: string;
}

/**
 * Verify a webhook signature.
 *
 * @returns true if the signature is valid, false otherwise.
 */
export async function verifyWebhook(params: VerifyWebhookParams): Promise<boolean>;
/**
 * Verify a webhook signature from raw headers.
 *
 * @param payload - Raw request body as string
 * @param headers - Request headers containing x-vq-signature and x-vq-timestamp
 * @param secret - Webhook signing secret
 * @returns Parsed WebhookEvent if valid.
 * @throws VecTradeError if signature is invalid or missing.
 */
export async function verifyWebhook(
  payload: string,
  headers: Record<string, string>,
  secret: string
): Promise<WebhookEvent>;
export async function verifyWebhook(
  payloadOrParams: string | VerifyWebhookParams,
  headers?: Record<string, string>,
  secret?: string
): Promise<boolean | WebhookEvent> {
  // Object-style call
  if (typeof payloadOrParams !== "string") {
    const { payload, signature, timestamp, secret: sec } = payloadOrParams;

    // Validate timestamp tolerance to prevent replay attacks
    const tsNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (isNaN(tsNum) || Math.abs(now - tsNum) > TOLERANCE_SECONDS) {
      return false;
    }

    const isValid = await computeAndCompare(payload, signature, timestamp, sec);
    return isValid;
  }

  // Legacy 3-arg call (payload, headers, secret)
  const sig = headers?.[SIGNATURE_HEADER];
  const ts = headers?.[TIMESTAMP_HEADER];

  if (!sig || !ts || !secret) {
    throw new Error("Missing webhook signature headers");
  }

  // Check timestamp tolerance
  const tsNum = parseInt(ts, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - tsNum) > TOLERANCE_SECONDS) {
    throw new Error("Webhook timestamp outside tolerance window");
  }

  const isValid = await computeAndCompare(payloadOrParams, sig, ts, secret);
  if (!isValid) {
    throw new Error("Invalid webhook signature");
  }

  return JSON.parse(payloadOrParams) as WebhookEvent;
}

async function computeAndCompare(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const signedPayload = `${timestamp}.${payload}`;
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expectedSignature = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison using double-HMAC pattern
  // This prevents timing attacks by comparing two HMACs rather than raw strings
  const comparisonKey = await crypto.subtle.importKey(
    "raw",
    crypto.getRandomValues(new Uint8Array(32)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const [hmacA, hmacB] = await Promise.all([
    crypto.subtle.sign("HMAC", comparisonKey, encoder.encode(signature)),
    crypto.subtle.sign("HMAC", comparisonKey, encoder.encode(expectedSignature)),
  ]);

  const a = new Uint8Array(hmacA);
  const b = new Uint8Array(hmacB);
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i]! ^ b[i]!;
  }
  return result === 0;
}
