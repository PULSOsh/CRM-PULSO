"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, UserCheck, Target, FileText, FolderKanban, Users, Loader2, X } from "lucide-react";
import { globalSearch, SearchResultItem } from "@/app/(crm)/app/busca/actions";

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ open, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await globalSearch(query);
        setResults(res);
        setSelectedIndex(0);
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  function handleSelect(href: string) {
    onClose();
    router.push(href);
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Header */}
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3.5">
          <Search className="size-5 text-[var(--muted)] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, código, e-mail ou proposta... (ex: PROP-001)"
            className="flex-1 bg-transparent text-base text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
            autoFocus
          />
          {isPending && <Loader2 className="size-4 animate-spin text-[var(--signal)]" />}
          <button 
            onClick={onClose}
            className="grid size-7 place-items-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
          {query.trim().length > 0 && results.length === 0 && !isPending && (
            <div className="py-12 text-center text-sm text-[var(--muted)]">
              Nenhum resultado encontrado para &quot;<strong>{query}</strong>&quot;
            </div>
          )}

          {query.trim().length === 0 && (
            <div className="py-8 px-4 text-center text-xs text-[var(--muted)]">
              Digite um termo para pesquisar em <strong className="text-[var(--text)]">Leads, Oportunidades, Clientes, Projetos e Propostas</strong>.
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((item, idx) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-left transition-all ${
                    selectedIndex === idx ? "bg-[var(--soft)] border border-[var(--line)]" : "hover:bg-[var(--soft)]/50"
                  }`}
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[var(--text)] truncate">{item.title}</span>
                      {item.code && (
                        <span className="rounded bg-[var(--soft)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--muted)]">
                          {item.code}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] truncate">{item.subtitle}</p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--signal)] shrink-0">Abrir &rarr;</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--line)] bg-[var(--soft)]/40 px-4 py-2 text-[11px] text-[var(--muted)]">
          <span>Dica: Use <kbd className="rounded border border-[var(--line)] px-1 font-mono">ESC</kbd> para fechar</span>
          <span>PULSO CRM Global Search</span>
        </div>
      </div>
    </div>
  );
}
