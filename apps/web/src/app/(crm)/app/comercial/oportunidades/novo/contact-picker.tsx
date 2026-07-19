"use client";

import { useState, useTransition } from "react";
import { searchContactsForOpportunity } from "../actions";

export function ContactPicker() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [results, setResults] = useState<{ id: string; name: string; email: string | null }[]>([]);
  const [pending, startTransition] = useTransition();

  function handleSearch() {
    startTransition(async () => {
      const found = await searchContactsForOpportunity(query);
      setResults(found);
    });
  }

  return (
    <div>
      <input type="hidden" name="contactId" value={selected?.id ?? ""} />
      <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]">Contato (opcional)</label>
      {selected ? (
        <div className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3.5 py-2.5 text-sm">
          <span className="font-semibold">{selected.name}</span>
          <button type="button" onClick={() => setSelected(null)} className="text-xs font-bold text-[var(--muted)] hover:text-[var(--carbon)]">Trocar</button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              placeholder="Buscar contato por nome ou e-mail"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]"
            />
            <button type="button" onClick={handleSearch} disabled={pending} className="secondary-button shrink-0">Buscar</button>
          </div>
          {results.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {results.map((contact) => (
                <button
                  key={contact.id} type="button"
                  onClick={() => { setSelected(contact); setResults([]); }}
                  className="flex w-full items-center justify-between rounded-lg bg-[var(--soft)] px-3 py-2 text-left text-sm hover:bg-[var(--line)]"
                >
                  <span className="font-semibold">{contact.name}</span>
                  <span className="text-xs text-[var(--muted)]">{contact.email}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
