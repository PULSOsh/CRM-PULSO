"use client";

import { useState, useTransition } from "react";
import { X, Save, CheckCircle2, Loader2, Sparkles, Key, Lock, Server, ShieldCheck } from "lucide-react";
import { saveIntegrationConfig } from "./actions";

interface IntegrationModalProps {
  keyName: string;
  title: string;
  description: string;
  initialValues?: Record<string, string>;
  open: boolean;
  onClose: () => void;
}

export function IntegrationModal({ keyName, title, description, initialValues = {}, open, onClose }: IntegrationModalProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>(initialValues);
  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!open) return null;

  function handleChange(field: string, val: string) {
    setFormValues((prev) => ({ ...prev, [field]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveIntegrationConfig(keyName, formValues);
      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          onClose();
        }, 1200);
      }
    });
  }

  function renderFields() {
    switch (keyName) {
      case "email":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--muted)] mb-1">Provedor de E-mail</label>
              <select
                value={formValues.provider || "smtp"}
                onChange={(e) => handleChange("provider", e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm font-semibold outline-none"
              >
                <option value="smtp">SMTP Personalizado</option>
                <option value="resend">Resend API</option>
              </select>
            </div>

            {formValues.provider === "resend" ? (
              <div>
                <label className="block text-xs font-bold text-[var(--muted)] mb-1">Resend API Key</label>
                <input
                  type="password"
                  placeholder="re_123456789..."
                  value={formValues.apiKey || ""}
                  onChange={(e) => handleChange("apiKey", e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none"
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] mb-1">Servidor SMTP</label>
                    <input
                      type="text"
                      placeholder="smtp.resend.com"
                      value={formValues.smtpHost || ""}
                      onChange={(e) => handleChange("smtpHost", e.target.value)}
                      className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] mb-1">Porta</label>
                    <input
                      type="text"
                      placeholder="587"
                      value={formValues.smtpPort || ""}
                      onChange={(e) => handleChange("smtpPort", e.target.value)}
                      className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--muted)] mb-1">Usuário SMTP</label>
                  <input
                    type="text"
                    placeholder="resend"
                    value={formValues.smtpUser || ""}
                    onChange={(e) => handleChange("smtpUser", e.target.value)}
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--muted)] mb-1">Senha SMTP</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={formValues.smtpPass || ""}
                    onChange={(e) => handleChange("smtpPass", e.target.value)}
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-[var(--muted)] mb-1">E-mail Remetente (From)</label>
              <input
                type="email"
                placeholder="contato@pulsosh.cloud"
                value={formValues.fromEmail || ""}
                onChange={(e) => handleChange("fromEmail", e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
        );

      case "gcalendar":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--muted)] mb-1">Google OAuth Client ID</label>
              <input
                type="text"
                placeholder="123456789-abc.apps.googleusercontent.com"
                value={formValues.clientId || ""}
                onChange={(e) => handleChange("clientId", e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--muted)] mb-1">Google OAuth Client Secret</label>
              <input
                type="password"
                placeholder="GOCSPX-..."
                value={formValues.clientSecret || ""}
                onChange={(e) => handleChange("clientSecret", e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--muted)] mb-1">ID do Calendário Padrão</label>
              <input
                type="text"
                placeholder="primary ou email@gmail.com"
                value={formValues.calendarId || ""}
                onChange={(e) => handleChange("calendarId", e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
        );

      case "zapsign":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--muted)] mb-1">ZapSign API Token</label>
              <input
                type="password"
                placeholder="Token de API da ZapSign..."
                value={formValues.apiToken || ""}
                onChange={(e) => handleChange("apiToken", e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--muted)] mb-1">ZapSign Webhook Secret</label>
              <input
                type="password"
                placeholder="Secret para validação de assinatura..."
                value={formValues.webhookSecret || ""}
                onChange={(e) => handleChange("webhookSecret", e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
        );

      case "abacatepay":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--muted)] mb-1">AbacatePay Secret Key</label>
              <input
                type="password"
                placeholder="abc_sec_..."
                value={formValues.secretKey || ""}
                onChange={(e) => handleChange("secretKey", e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--muted)] mb-1">AbacatePay Public Key</label>
              <input
                type="text"
                placeholder="abc_pub_..."
                value={formValues.publicKey || ""}
                onChange={(e) => handleChange("publicKey", e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
        );

      case "ai":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--muted)] mb-1">Provedor Principal de IA</label>
              <select
                value={formValues.provider || "gemini"}
                onChange={(e) => handleChange("provider", e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm font-semibold outline-none"
              >
                <option value="gemini">Google Gemini (Recomendado)</option>
                <option value="openai">OpenAI (GPT-4o)</option>
                <option value="groq">Groq AI (Llama 3)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--muted)] mb-1">Google Gemini API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={formValues.geminiApiKey || ""}
                onChange={(e) => handleChange("geminiApiKey", e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--muted)] mb-1">OpenAI API Key (Opcional)</label>
              <input
                type="password"
                placeholder="sk-..."
                value={formValues.openaiApiKey || ""}
                onChange={(e) => handleChange("openaiApiKey", e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-[var(--signal)]/10 text-[var(--signal)]">
              <Key className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[var(--text)]">{title}</h2>
              <p className="text-xs text-[var(--muted)]">Configuração de API & Credenciais</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-[var(--muted)] leading-relaxed">{description}</p>

          {renderFields()}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--line)] text-xs font-bold text-[var(--muted)] hover:text-[var(--text)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || savedSuccess}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--signal)] text-white text-xs font-bold shadow-md hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="size-4 text-white" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  <span>Salvar Configuração</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
