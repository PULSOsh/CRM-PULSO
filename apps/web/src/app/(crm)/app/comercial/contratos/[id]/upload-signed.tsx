"use client";

import { useState, useTransition } from "react";
import { linkSignedDocument } from "../actions";

export function UploadSignedDocument({ contractId }: { contractId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("entityType", "contract");
      formData.set("entityId", contractId);
      formData.set("visibility", "internal");

      const res = await fetch("/api/files", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Não foi possível enviar o arquivo."); return; }

      await linkSignedDocument(contractId, data.id);
    });
  }

  return (
    <div>
      <label className="secondary-button inline-flex cursor-pointer">
        {pending ? "Enviando..." : "Enviar documento assinado (PDF, JPG ou PNG)"}
        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleChange} disabled={pending} className="hidden" />
      </label>
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-[#b3261e]">{error}</p>}
    </div>
  );
}
