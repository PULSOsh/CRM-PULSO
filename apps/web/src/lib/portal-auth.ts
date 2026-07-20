import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db, schema } from "@pulso/database";
import { hashPublicToken } from "@pulso/database/tokens";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";

const PORTAL_COOKIE = "portal_session";
const SESSION_DAYS = 14;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function createPortalSession(portalUserId: string, ip: string | null, userAgent: string | null) {
  const token = randomBytes(24).toString("base64url");
  const tokenHash = hashPublicToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(schema.portalSessions).values({ portalUserId, tokenHash, expiresAt, ipAddress: ip, userAgent });

  const jar = await cookies();
  jar.set(PORTAL_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/portal", expires: expiresAt });
}

export async function destroyPortalSession() {
  const jar = await cookies();
  const token = jar.get(PORTAL_COOKIE)?.value;
  if (token) await db.delete(schema.portalSessions).where(eq(schema.portalSessions.tokenHash, hashPublicToken(token)));
  jar.delete(PORTAL_COOKIE);
}

export async function getPortalSession() {
  const jar = await cookies();
  const token = jar.get(PORTAL_COOKIE)?.value;
  if (!token) return null;

  const [session] = await db.select({ session: schema.portalSessions, portalUser: schema.portalUsers })
    .from(schema.portalSessions)
    .innerJoin(schema.portalUsers, eq(schema.portalUsers.id, schema.portalSessions.portalUserId))
    .where(and(eq(schema.portalSessions.tokenHash, hashPublicToken(token)), gt(schema.portalSessions.expiresAt, new Date())))
    .limit(1);

  if (!session || session.portalUser.status !== "active") return null;
  return session.portalUser;
}
