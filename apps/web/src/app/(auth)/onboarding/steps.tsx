"use client";

import { CheckCircle2, CircleDollarSign, Mail, MessageCircle, PenTool } from "lucide-react";
import { useActionState } from "react";
import { createFirstAdmin, finishOnboarding, saveWorkspaceSettings, type OnboardingActionState } from "./actions";

const initialState: OnboardingActionState = {};

function StepBadge({ step, total }: { step: number; total: number }) {
  return (
    <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">
      Configuração inicial · Etapa {step} de {total}
    </p>
  );
}

export function AdminStep() {
  const [state, formAction, pending] = useActionState(createFirstAdmin, initialState);

  return (
    <>
      <StepBadge step={1} total={3} />
      <h1 className="text-2xl font-extrabold tracking-[-0.03em]">Criar administrador</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        O PULSO CRM tem um único administrador interno. Essa conta poderá ser usada para acessar o sistema depois.
      </p>
      <form className="mt-6 space-y-4" action={formAction}>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="name">Nome</label>
          <input id="name" name="name" required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required autoComplete="username" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="password">Senha</label>
          <input id="password" name="password" type="password" required minLength={12} autoComplete="new-password" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
          <p className="mt-1 text-xs text-[var(--muted)]">Mínimo de 12 caracteres.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="confirmPassword">Confirmar senha</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required minLength={12} autoComplete="new-password" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        {state.error && <p role="alert" className="rounded-lg bg-[color:#b3261e/.08] px-3 py-2 text-sm font-semibold text-[#b3261e]">{state.error}</p>}
        <button type="submit" disabled={pending} className="primary-button w-full justify-center">
          {pending ? "Criando..." : "Criar administrador"}
        </button>
      </form>
    </>
  );
}

export function WorkspaceStep() {
  const [state, formAction, pending] = useActionState(saveWorkspaceSettings, initialState);

  return (
    <>
      <StepBadge step={2} total={3} />
      <h1 className="text-2xl font-extrabold tracking-[-0.03em]">Dados da PULSO</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Usados em propostas, contratos, PDFs e e-mails.</p>
      <form className="mt-6 space-y-4" action={formAction}>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="workspaceName">Nome fantasia</label>
          <input id="workspaceName" name="workspaceName" required defaultValue="PULSO" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="legalName">Razão social</label>
          <input id="legalName" name="legalName" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="document">CNPJ / CPF</label>
          <input id="document" name="document" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="monthlyRevenueGoal">Meta de receita mensal (opcional)</label>
          <div className="relative">
            <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <input id="monthlyRevenueGoal" name="monthlyRevenueGoal" inputMode="decimal" placeholder="0,00" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] py-2.5 pl-9 pr-3.5 text-sm outline-none focus:border-[var(--signal)]" />
          </div>
        </div>
        {state.error && <p role="alert" className="rounded-lg bg-[color:#b3261e/.08] px-3 py-2 text-sm font-semibold text-[#b3261e]">{state.error}</p>}
        <button type="submit" disabled={pending} className="primary-button w-full justify-center">
          {pending ? "Salvando..." : "Continuar"}
        </button>
      </form>
    </>
  );
}

const integrations = [
  { icon: Mail, title: "E-mail", description: "Modo de desenvolvimento ativo. Configure SMTP ou Resend depois." },
  { icon: PenTool, title: "Assinatura", description: "Assinatura interna PULSO ativa. ZapSign pode ser ligado depois." },
  { icon: MessageCircle, title: "Telegram e IA", description: "Desativados. O CRM funciona 100% sem eles." }
];

export function IntegrationsStep() {
  return (
    <>
      <StepBadge step={3} total={3} />
      <h1 className="text-2xl font-extrabold tracking-[-0.03em]">Integrações</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Todas são opcionais e podem ser configuradas depois em Configurações.</p>
      <div className="mt-6 space-y-3">
        {integrations.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-4">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--surface)]"><Icon className="size-4" /></div>
              <div><p className="text-sm font-extrabold">{item.title}</p><p className="mt-0.5 text-xs text-[var(--muted)]">{item.description}</p></div>
            </div>
          );
        })}
      </div>
      <form className="mt-6" action={finishOnboarding}>
        <button type="submit" className="primary-button w-full justify-center">
          <CheckCircle2 className="size-4" />Concluir configuração
        </button>
      </form>
    </>
  );
}
