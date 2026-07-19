import { z } from "zod";

export const emailMessageSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1),
  text: z.string().min(1),
  idempotencyKey: z.string().min(8),
});

export type EmailMessage = z.infer<typeof emailMessageSchema>;

export interface EmailProvider {
  name: string;
  send(message: EmailMessage): Promise<{ id: string; accepted: boolean }>;
}

export class DevelopmentEmailProvider implements EmailProvider {
  name = "dev";
  async send(message: EmailMessage) {
    const parsed = emailMessageSchema.parse(message);
    console.info("[PULSO EMAIL DEV]", {
      to: parsed.to,
      subject: parsed.subject,
      idempotencyKey: parsed.idempotencyKey,
    });
    return { id: `dev-${Date.now()}`, accepted: true };
  }
}

type TemplateInput = {
  preview: string;
  eyebrow?: string;
  title: string;
  body: string;
  buttonLabel?: string;
  buttonUrl?: string;
  secondaryText?: string;
  footer?: string;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
    };
    return map[char];
  });

export function renderPulsoEmail(input: TemplateInput) {
  const title = escapeHtml(input.title);
  const body = escapeHtml(input.body).replace(/\n/g, "<br>");
  const button = input.buttonLabel && input.buttonUrl
    ? `<tr><td style="padding:24px 0 8px"><a href="${escapeHtml(input.buttonUrl)}" style="display:inline-block;background:#E65318;color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 22px;border-radius:10px">${escapeHtml(input.buttonLabel)}</a></td></tr>`
    : "";

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#F4F2ED;color:#161616">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(input.preview)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4F2ED"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border:1px solid #dedbd4;border-radius:18px;overflow:hidden">
<tr><td style="background:#161616;padding:24px 30px"><div style="font-family:Arial,sans-serif;color:#fff;font-weight:800;font-size:20px">PULSO<span style="color:#E65318">.</span></div></td></tr>
<tr><td style="padding:36px 30px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">
${input.eyebrow ? `<tr><td style="font-family:Arial,sans-serif;color:#E65318;text-transform:uppercase;letter-spacing:1.4px;font-size:11px;font-weight:800;padding-bottom:12px">${escapeHtml(input.eyebrow)}</td></tr>` : ""}
<tr><td style="font-family:Arial,sans-serif;font-size:30px;line-height:1.12;font-weight:800;padding-bottom:18px">${title}</td></tr>
<tr><td style="font-family:Arial,sans-serif;color:#4b4b4b;font-size:16px;line-height:1.65">${body}</td></tr>${button}
${input.secondaryText ? `<tr><td style="font-family:Arial,sans-serif;color:#7A7A7A;font-size:13px;line-height:1.55;padding-top:18px">${escapeHtml(input.secondaryText)}</td></tr>` : ""}
</table></td></tr>
<tr><td style="border-top:1px solid #ece9e2;padding:20px 30px;font-family:Arial,sans-serif;color:#7A7A7A;font-size:12px;line-height:1.5">${escapeHtml(input.footer ?? "PULSO — soluções digitais com clareza, processo e resultado.")}</td></tr>
</table></td></tr></table></body></html>`;

  const text = [input.eyebrow, input.title, input.body,
    input.buttonLabel && input.buttonUrl ? `${input.buttonLabel}: ${input.buttonUrl}` : undefined,
    input.secondaryText, input.footer].filter(Boolean).join("\n\n");
  return { html, text };
}

export const emailTemplates = {
  briefingRequested: (name: string, url: string) =>
    renderPulsoEmail({
      preview: "Seu briefing da PULSO está disponível.",
      eyebrow: "Briefing",
      title: `Olá, ${name}. Vamos entender seu projeto?`,
      body: "Preparamos um espaço seguro para você compartilhar objetivos, referências, necessidades e materiais. Suas respostas ficam salvas automaticamente.",
      buttonLabel: "Responder briefing",
      buttonUrl: url,
      secondaryText: "O link é individual. Evite encaminhá-lo para pessoas não autorizadas.",
    }),
  proposalPublished: (name: string, url: string) =>
    renderPulsoEmail({
      preview: "Sua proposta comercial da PULSO está pronta.",
      eyebrow: "Proposta comercial",
      title: `${name}, sua proposta está pronta`,
      body: "Você pode revisar o escopo, escolher adicionais, conferir as condições de pagamento e registrar sua decisão diretamente na página.",
      buttonLabel: "Abrir proposta",
      buttonUrl: url,
    }),
  passwordReset: (name: string, url: string) =>
    renderPulsoEmail({
      preview: "Redefinição de senha solicitada.",
      eyebrow: "Segurança",
      title: `Olá, ${name}. Redefina sua senha`,
      body: "Recebemos uma solicitação para redefinir sua senha de acesso ao PULSO CRM. Se você não fez essa solicitação, ignore este e-mail com segurança.",
      buttonLabel: "Redefinir senha",
      buttonUrl: url,
      secondaryText: "Este link expira em algumas horas por segurança.",
    }),
  paymentReminder: (name: string, amount: string, dueDate: string, url: string) =>
    renderPulsoEmail({
      preview: "Lembrete de vencimento.",
      eyebrow: "Financeiro",
      title: "Lembrete de pagamento",
      body: `Olá, ${name}. Há uma parcela de ${amount} com vencimento em ${dueDate}. Caso o pagamento já tenha sido realizado, desconsidere este aviso.`,
      buttonLabel: "Ver cobrança",
      buttonUrl: url,
    }),
};
