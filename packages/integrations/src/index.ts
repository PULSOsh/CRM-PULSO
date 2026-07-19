export type IntegrationStatus =
  | "not_configured"
  | "testing"
  | "active"
  | "error"
  | "disabled";

export interface IntegrationHealth {
  status: IntegrationStatus;
  message: string;
  checkedAt: Date;
}

export interface AiProvider {
  name: string;
  complete(input: {
    purpose: string;
    prompt: string;
    sensitiveDataApproved: boolean;
  }): Promise<{ content: string; model: string; estimatedCost?: number }>;
}

export interface SignatureProvider {
  name: string;
  createEnvelope(input: {
    contractId: string;
    documentUrl: string;
    signers: Array<{ name: string; email: string; document?: string }>;
  }): Promise<{ externalId: string; signingUrl?: string }>;
  cancelEnvelope(externalId: string): Promise<void>;
}

export interface PaymentProvider {
  name: string;
  createCharge(input: {
    idempotencyKey: string;
    amountInCents: number;
    description: string;
    customer: { name: string; email?: string; document?: string };
  }): Promise<{ externalId: string; checkoutUrl?: string; pixCode?: string }>;
  cancelCharge(externalId: string): Promise<void>;
}

export interface TelegramProvider {
  sendAdminAlert(input: {
    title: string;
    summary: string;
    secureUrl: string;
  }): Promise<{ messageId: string }>;
}

export class DisabledAiProvider implements AiProvider {
  name = "disabled";
  async complete(): Promise<never> {
    throw new Error("A inteligência artificial está desativada. O fluxo manual permanece disponível.");
  }
}

export class InternalSignatureProvider implements SignatureProvider {
  name = "internal";
  async createEnvelope(input: {
    contractId: string;
    documentUrl: string;
    signers: Array<{ name: string; email: string; document?: string }>;
  }) {
    return { externalId: `internal:${input.contractId}`, signingUrl: input.documentUrl };
  }
  async cancelEnvelope() {}
}

export class ManualPaymentProvider implements PaymentProvider {
  name = "manual";
  async createCharge(input: {
    idempotencyKey: string;
    amountInCents: number;
    description: string;
    customer: { name: string; email?: string; document?: string };
  }) {
    return { externalId: `manual:${input.idempotencyKey}` };
  }
  async cancelCharge() {}
}

export const featureFlags = {
  email: process.env.EMAIL_PROVIDER !== "disabled",
  telegram: process.env.TELEGRAM_ENABLED === "true",
  ai: process.env.AI_PROVIDER !== "disabled",
  signatureExternal: ["zapsign", "clicksign"].includes(process.env.SIGNATURE_PROVIDER ?? ""),
  paymentGateway: process.env.PAYMENT_PROVIDER === "abacatepay",
  googleCalendar: process.env.GOOGLE_CALENDAR_ENABLED === "true",
};
