import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { recordAuditEvent } from "@pulso/database/audit";
import { db, schema } from "@pulso/database";
import { DevelopmentEmailProvider, emailTemplates } from "@pulso/email";
import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";

const emailProvider = new DevelopmentEmailProvider();
const port = process.env.PORT ?? "3000";
// Fora de produção, aceita também localhost/127.0.0.1 na mesma porta (dev local, testes E2E)
// além da origem pública configurada em BETTER_AUTH_URL/APP_URL.
const devOrigins = process.env.NODE_ENV === "production" ? [] : [`http://localhost:${port}`, `http://127.0.0.1:${port}`];

export const auth = betterAuth({
  appName: "PULSO CRM",
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000",
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000", ...devOrigins],
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
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const rendered = emailTemplates.passwordReset(user.name || user.email, url);
      await emailProvider.send({
        to: user.email,
        subject: "Redefinição de senha — PULSO CRM",
        html: rendered.html,
        text: rendered.text,
        idempotencyKey: `password-reset-${user.id}-${Date.now()}`
      });
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/forget-password": { window: 60, max: 3 }
    }
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production"
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const ip = ctx.request?.headers.get("x-forwarded-for") ?? ctx.request?.headers.get("x-real-ip") ?? null;
      const userAgent = ctx.request?.headers.get("user-agent") ?? null;

      if (ctx.path.startsWith("/sign-in/email")) {
        const newSession = ctx.context.newSession;
        await recordAuditEvent({
          actorType: newSession ? "user" : "anonymous",
          actorId: newSession?.user.id ?? null,
          action: newSession ? "auth.login_success" : "auth.login_failed",
          entityType: "user",
          entityId: newSession?.user.id ?? "unknown",
          ipAddress: ip,
          userAgent
        });
      }

      if (ctx.path.startsWith("/sign-out")) {
        const authHeader = ctx.request?.headers.get("cookie") ?? "";
        await recordAuditEvent({
          actorType: "user",
          actorId: null,
          action: "auth.logout",
          entityType: "user",
          entityId: authHeader ? "session" : "unknown",
          ipAddress: ip,
          userAgent
        });
      }
    })
  }
});
