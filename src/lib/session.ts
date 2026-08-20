/**
 * Signed auth cookie. The cookie stores a portal id together with an HMAC over
 * it, so a client can't just set `ce_auth=portal2` to bypass the password the way
 * a bare value allowed. Uses Web Crypto (present in the Cloudflare Workers
 * runtime), the same primitive as the Stripe webhook verifier.
 */
const enc = new TextEncoder();

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Signed cookie value for a portal id: `portalId.<hmac>`. */
export async function signPortal(portalId: string, secret: string): Promise<string> {
  return `${portalId}.${await hmacHex(portalId, secret)}`;
}

/** Return the portal id iff `value` carries a valid signature, else null. */
export async function verifyPortal(
  value: string | undefined | null,
  secret: string,
): Promise<string | null> {
  if (!value || !secret) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const portalId = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  const expected = await hmacHex(portalId, secret);
  return timingSafeEqual(expected, mac) ? portalId : null;
}
