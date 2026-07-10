import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies an HMAC-SHA256 signature using timing-safe comparison.
 * @param {string} secret - shared secret (hex string)
 * @param {string} body - raw request body
 * @param {string} signature - hex signature from x-pi-signature header
 * @returns {boolean}
 */
export function verifySignature(secret, body, signature) {
  if (!signature || typeof signature !== "string") return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Creates an HMAC-SHA256 signature for a body.
 * Used by the PI extension and test clients.
 */
export function sign(secret, body) {
  return createHmac("sha256", secret).update(body).digest("hex");
}
