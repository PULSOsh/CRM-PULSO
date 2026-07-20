"use client";

import { useState, useTransition } from "react";
import { signInternally } from "../actions";

export function InternalSignForm({ contractId, signatoryId, defaultName }: { contractId: string; signatoryId: string; defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [document, setDocument] = useState("");
  const [declaration, setDeclaration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!declaration) { setError("Confirme a declaração de assinatura."); return; }
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("name", name);
        formData.set("document", document);
        formData.set("declaration", "on");
        await signInternally(contractId, signatoryId, formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível assinar.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-4">
      <p className="text-xs font-bold text-[var(--muted-strong)]">Assinar internamente como {defaultName}</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
      <input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="CPF/CNPJ (opcional)" className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
      <label className="flex items-start gap-2 text-xs leading-5 text-[var(--muted)]">
        <input type="checkbox" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} className="mt-0.5 size-4" />
        Declaro que li e assino este contrato.
      </label>
      {error && <p role="alert" className="text-xs font-semibold text-[#b3261e]">{error}</p>}
      <button type="submit" disabled={pending} className="primary-button w-full justify-center">{pending ? "Assinando..." : "Assinar"}</button>
    </form>
  );
}
