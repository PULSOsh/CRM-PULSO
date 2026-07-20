"use client";

import { useState, useTransition } from "react";

type CompanyResult = { id: string; tradeName: string; code: string };

export function CompanyPicker({
  name = "companyId", searchAction
}: {
  name?: string;
  searchAction: (q: string) => Promise<CompanyResult[]>;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CompanyResult | null>(null);
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [pending, startTransition] = useTransition();

  function handleSearch() {
    startTransition(async () => {
      const found = await searchAction(query);
      setResults(found);
    });
  }

  return (
    <div>
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]">Empresa</label>
      {selected ? (
        <div className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3.5 py-2.5 text-sm">
          <span className="font-semibold">{selected.tradeName} <span className="text-xs font-normal text-[var(--muted)]">{selected.code}</span></span>
          <button type="button" onClick={() => setSelected(null)} className="text-xs font-bold text-[var(--muted)] hover:text-[var(--carbon)]">Trocar</button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              placeholder="Buscar empresa por nome"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]"
            />
            <button type="button" onClick={handleSearch} disabled={pending} className="secondary-button shrink-0">Buscar</button>
          </div>
          {results.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {results.map((c) => (
                <button key={c.id} type="button" onClick={() => { setSelected(c); setResults([]); }}
                  className="flex w-full items-center justify-between rounded-lg bg-[var(--soft)] px-3 py-2 text-left text-sm hover:bg-[var(--line)]">
                  <span className="font-semibold">{c.tradeName}</span><span className="text-xs text-[var(--muted)]">{c.code}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
