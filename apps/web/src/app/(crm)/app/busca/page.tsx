"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, UserCheck, Target, Users, FolderKanban, FileText } from "lucide-react";
import { Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { globalSearch, SearchResultItem } from "./actions";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleSearch(q: string) {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    startTransition(async () => {
      const res = await globalSearch(q);
      setResults(res);
    });
  }

  function getIcon(type: SearchResultItem["type"]) {
    switch (type) {
      case "lead":
        return <UserCheck className="size-4 text-amber-500" />;
      case "opportunity":
        return <Target className="size-4 text-[var(--signal)]" />;
      case "contact":
        return <Users className="size-4 text-blue-500" />;
      case "project":
        return <FolderKanban className="size-4 text-emerald-500" />;
      case "proposal":
        return <FileText className="size-4 text-purple-500" />;
    }
  }

  return (
    <>
      <PageHeader 
        eyebrow="Ctrl + K" 
        title="Busca Global" 
        description="Encontre qualquer lead, oportunidade, cliente, projeto ou proposta instantaneamente." 
      />

      <Card className="mx-auto max-w-3xl p-4">
        <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-3">
          <Search className="size-5 text-[var(--signal)] shrink-0" />
          <input 
            className="min-w-0 flex-1 bg-transparent text-lg text-[var(--text)] outline-none placeholder:text-[var(--muted)]" 
            placeholder="Buscar no CRM por nome, código ou e-mail..." 
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus 
          />
          {isPending && <Loader2 className="size-5 animate-spin text-[var(--signal)]" />}
        </div>

        {query.trim().length > 0 && results.length === 0 && !isPending && (
          <div className="p-8 text-center text-sm text-[var(--muted)]">
            Nenhum registro encontrado para &quot;<strong>{query}</strong>&quot;.
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4 space-y-1">
            {results.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => router.push(item.href)}
                className="flex w-full items-center gap-3.5 rounded-xl border border-transparent p-3 text-left transition-all hover:border-[var(--line)] hover:bg-[var(--soft)]"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                  {getIcon(item.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[var(--text)]">{item.title}</span>
                    {item.code && (
                      <span className="rounded bg-[var(--soft)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--muted)]">
                        {item.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)]">{item.subtitle}</p>
                </div>
                <span className="text-xs font-semibold text-[var(--signal)]">Abrir &rarr;</span>
              </button>
            ))}
          </div>
        )}

        {query.trim().length === 0 && (
          <div className="p-8 text-center text-sm text-[var(--muted)]">
            Digite um nome, código ou palavra-chave. Exemplo: <strong className="text-[var(--text)]">PROP-2026-0001</strong>.
          </div>
        )}
      </Card>
    </>
  );
}
