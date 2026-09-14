import { createHmac, timingSafeEqual } from "node:crypto";

export interface PlatformIdentity {
  userId: string;
  toolId: string;
  requestId: string;
  expiresAt: number;
}

/** Platform context is authenticated with a per-tool secret; browser identity headers are never trusted. */
export function verifyPlatformContext(token: unknown, secret: string, toolId: string, now = Math.floor(Date.now() / 1000)): PlatformIdentity | null {
  if (typeof token !== "string" || token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))) return null;
  const [payload, signature] = parts;
  const expected = createHmac("sha256", secret).update(payload).digest();
  const received = Buffer.from(signature, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const data: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data || typeof data !== "object") return null;
    const claims = data as Record<string, unknown>;
    if (typeof claims.userId !== "string" || !claims.userId || claims.userId.length > 256 ||
        claims.toolId !== toolId || typeof claims.requestId !== "string" || !claims.requestId || claims.requestId.length > 256 ||
        !Number.isSafeInteger(claims.expiresAt) || (claims.expiresAt as number) <= now || (claims.expiresAt as number) > now + 120) return null;
    return claims as unknown as PlatformIdentity;
  } catch { return null; }
}
