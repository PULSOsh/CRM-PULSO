"use client";

import { useState, useTransition } from "react";
import { linkContactToCompany, searchContactsForLink } from "../../actions";

export function LinkContactWidget({ companyId }: { companyId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; email: string | null }[]>([]);
  const [pending, startTransition] = useTransition();

  function handleSearch() {
    startTransition(async () => {
      const found = await searchContactsForLink(query);
      setResults(found);
    });
  }

  return (
    <div className="rounded-xl border border-[var(--line)] p-3">
      <p className="mb-2 text-xs font-bold text-[var(--muted-strong)]">Vincular contato existente</p>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Buscar por nome ou e-mail"
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]"
        />
        <button type="button" onClick={handleSearch} disabled={pending} className="secondary-button shrink-0">Buscar</button>
      </div>
      {results.length > 0 && (
        <div className="mt-2 space-y-2">
          {results.map((contact) => (
            <form
              key={contact.id}
              action={async () => {
                const formData = new FormData();
                formData.set("contactId", contact.id);
                await linkContactToCompany(companyId, formData);
                setResults([]);
                setQuery("");
              }}
              className="flex items-center justify-between gap-2 rounded-lg bg-[var(--soft)] px-3 py-2"
            >
              <span className="text-sm font-semibold">{contact.name}<span className="ml-2 text-xs font-normal text-[var(--muted)]">{contact.email}</span></span>
              <button type="submit" className="secondary-button px-3 py-1.5 text-xs">Vincular</button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
