"use client";

import { useState, useTransition } from "react";
import { updateContractContent } from "../actions";

export function ClausesEditor({ contractId, initialClauses }: { contractId: string; initialClauses: string }) {
  const [clauses, setClauses] = useState(initialClauses);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("clauses", clauses);
      await updateContractContent(contractId, formData);
      setSaved(true);
    });
  }

  return (
    <div>
      <textarea
        value={clauses} onChange={(e) => { setClauses(e.target.value); setSaved(false); }}
        rows={16}
        className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 font-mono text-xs leading-6 outline-none focus:border-[var(--signal)]"
      />
      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={handleSave} disabled={pending} className="secondary-button">{pending ? "Salvando..." : "Salvar cláusulas"}</button>
        {saved && <span className="text-xs font-bold text-[var(--signal)]">Salvo.</span>}
      </div>
    </div>
  );
}
