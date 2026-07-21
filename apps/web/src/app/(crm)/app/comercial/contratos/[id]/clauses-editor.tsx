"use client";

import { useState, useTransition } from "react";
import { updateContractContent } from "../actions";

export function ClausesEditor({ contractId, initialClauses, initialType }: { contractId: string; initialClauses: string; initialType: "mrr" | "avulso" }) {
  const [clauses, setClauses] = useState(initialClauses);
  const [type, setType] = useState(initialType);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("clauses", clauses);
      formData.set("type", type);
      await updateContractContent(contractId, formData);
      setSaved(true);
    });
  }

  return (
    <div>
      <div className="mb-4">
        <label className="mb-2 block text-xs font-bold text-[var(--muted-strong)]">Tipo do Contrato</label>
        <select value={type} onChange={(e) => { setType(e.target.value as "mrr" | "avulso"); setSaved(false); }} className="w-full sm:w-auto rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-bold outline-none focus:border-[var(--signal)]">
          <option value="avulso">Projeto Avulso (Pagamento único / parcelado sem recorrência)</option>
          <option value="mrr">MRR (Recorrente / Mensalidade)</option>
        </select>
      </div>
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
