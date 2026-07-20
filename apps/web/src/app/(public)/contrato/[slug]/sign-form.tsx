"use client";

import { useState, useTransition } from "react";
import { signContractPublic } from "./actions";

export function ClientSignForm({ contractId, signatoryId, token }: { contractId: string; signatoryId: string; token: string }) {
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [declaration, setDeclaration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Informe seu nome completo."); return; }
    if (!declaration) { setError("Confirme a declaração de assinatura."); return; }
    startTransition(async () => {
      try {
        await signContractPublic(contractId, signatoryId, token, { name, document, declaration });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível assinar.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <h2 className="text-lg font-extrabold">Assinar contrato</h2>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-sm outline-none focus:border-[var(--signal)]" />
      <input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="CPF/CNPJ" className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-sm outline-none focus:border-[var(--signal)]" />
      <label className="flex items-start gap-2 text-xs leading-5 text-[var(--muted)]">
        <input type="checkbox" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} className="mt-0.5 size-4" />
        Declaro que li e assino este contrato.
      </label>
      {error && <p role="alert" className="rounded-lg bg-[color:#b3261e/.08] px-3 py-2 text-xs font-semibold text-[#b3261e]">{error}</p>}
      <button type="submit" disabled={pending} className="primary-button w-full justify-center">{pending ? "Assinando..." : "Assinar contrato"}</button>
    </form>
  );
}
