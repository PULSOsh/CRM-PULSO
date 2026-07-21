"use client";

import { Upload, X, FileSpreadsheet } from "lucide-react";
import { useState, useTransition } from "react";
import { importProspectingItems } from "../actions";

export function ProspectingImportModal({ listId }: { listId: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setError("");
    startTransition(async () => {
      const formData = new FormData();
      formData.append("listId", listId);
      formData.append("file", file);

      const result = await importProspectingItems({}, formData);
      if (result.error) {
        setError(result.error);
      } else {
        alert(`Sucesso! ${result.count} contatos importados.`);
        setOpen(false);
        setFile(null);
      }
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="secondary-button !border-[var(--signal)] !text-[var(--signal)] hover:!bg-[var(--signal)]/10">
        <Upload className="size-4" /> Importar Planilha
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
              <h3 className="font-bold text-[var(--text)]">Importar Contatos</h3>
              <button onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-lg hover:bg-[var(--soft)] text-[var(--muted)]">
                <X className="size-4" />
              </button>
            </div>
            
            <form onSubmit={handleImport} className="p-5">
              <p className="mb-4 text-sm text-[var(--muted)]">
                Selecione uma planilha (Excel ou CSV) com seus leads. A primeira linha deve conter os cabeçalhos (ex: Nome, Telefone, Email, Segmento).
              </p>

              <label className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--line)] bg-[var(--soft)]/50 py-8 hover:border-[var(--signal)]/50 transition-colors">
                <FileSpreadsheet className="mb-2 size-8 text-[var(--muted)]" />
                <span className="text-sm font-semibold text-[var(--carbon)]">
                  {file ? file.name : "Clique para selecionar o arquivo"}
                </span>
                <input 
                  type="file" 
                  accept=".xlsx,.xls,.csv" 
                  className="hidden" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>

              {error && <p className="mb-4 text-sm font-semibold text-[var(--error)]">{error}</p>}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)} className="secondary-button" disabled={pending}>
                  Cancelar
                </button>
                <button type="submit" disabled={!file || pending} className="primary-button">
                  {pending ? "Importando..." : "Iniciar importação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
