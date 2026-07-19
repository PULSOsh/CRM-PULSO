import { createHash, randomBytes } from "node:crypto";

/** Token público (vai na URL) + hash (o que fica salvo no banco). Nunca salvar o token em texto puro. */
export function generatePublicToken() {
  const token = randomBytes(24).toString("base64url");
  return { token, tokenHash: hashPublicToken(token) };
}

export function hashPublicToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSlug(prefix: string) {
  const random = randomBytes(4).toString("hex");
  return `${prefix.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${random}`;
}
