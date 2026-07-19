import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db, schema } from "@pulso/database";
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  appName: "PULSO CRM",
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? "development-only-secret-change-before-production-000000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification
    }
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.NODE_ENV === "production",
    minPasswordLength: 12,
    revokeSessionsOnPasswordReset: true
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production"
  }
});
