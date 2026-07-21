"use client";

import { useState } from "react";
import { Badge, Card } from "@pulso/ui";
import { LayoutList, LayoutGrid, Phone, Mail, Instagram } from "lucide-react";
import type { schema } from "@pulso/database";

type ProspectingItem = typeof schema.prospectingItems.$inferSelect;

const STATUSES = [
  { id: "not_researched", label: "Não pesquisado", color: "neutral" },
  { id: "researched", label: "Pesquisado (Mapeado)", color: "info" },
  { id: "contacted", label: "Contatado", color: "warning" },
  { id: "waiting_reply", label: "Aguardando Resposta", color: "warning" },
  { id: "replied", label: "Respondeu", color: "success" },
  { id: "not_interested", label: "Sem interesse", color: "error" },
  { id: "converted", label: "Convertido (Lead/Oportunidade)", color: "success" },
] as const;

export function ProspectingView({ items }: { items: ProspectingItem[] }) {
  const [view, setView] = useState<"list" | "kanban">("list");

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setView("list")}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${view === "list" ? "bg-[var(--surface)] text-[var(--text)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
        >
          <LayoutList className="size-4" /> Lista
        </button>
        <button
          onClick={() => setView("kanban")}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${view === "kanban" ? "bg-[var(--surface)] text-[var(--text)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
        >
          <LayoutGrid className="size-4" /> Kanban
        </button>
      </div>

      {view === "list" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="border-b border-[var(--line)] bg-[var(--soft)] font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
                <tr>
                  <th className="px-5 py-4">Nome</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Contatos</th>
                  <th className="px-5 py-4">Segmento</th>
                  <th className="px-5 py-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--muted)]">Nenhum contato nesta lista.</td></tr>
                )}
                {items.map(item => (
                  <tr key={item.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--soft)]">
                    <td className="px-5 py-4 font-bold text-sm">
                      {item.name}
                      {item.companyName && <span className="block text-xs font-normal text-[var(--muted)]">{item.companyName}</span>}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={STATUSES.find(s => s.id === item.status)?.color as any || "neutral"}>
                        {STATUSES.find(s => s.id === item.status)?.label || item.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--muted)]">
                      {item.phone && <div className="flex items-center gap-1"><Phone className="size-3" /> {item.phone}</div>}
                      {item.instagram && <div className="flex items-center gap-1 mt-1"><Instagram className="size-3" /> {item.instagram}</div>}
                      {item.email && <div className="flex items-center gap-1 mt-1"><Mail className="size-3" /> {item.email}</div>}
                    </td>
                    <td className="px-5 py-4 text-sm">{item.segment || "—"}</td>
                    <td className="px-5 py-4 text-sm">
                      <button className="text-[var(--signal)] font-bold hover:underline">Ver detalhes</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin h-[calc(100vh-200px)]">
          {STATUSES.map(status => (
            <div key={status.id} className="flex w-[300px] shrink-0 flex-col rounded-xl bg-[var(--soft)]/50 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="font-bold text-sm">{status.label}</span>
                <Badge tone="neutral">{items.filter(i => i.status === status.id).length}</Badge>
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
                {items.filter(i => i.status === status.id).map(item => (
                  <Card key={item.id} className="p-4 hover:border-[var(--signal)]/50 cursor-pointer transition-colors shadow-sm">
                    <p className="font-bold text-sm leading-tight">{item.name}</p>
                    {item.segment && <p className="text-xs text-[var(--muted)] mt-1">{item.segment}</p>}
                    
                    <div className="mt-3 flex gap-2">
                      {item.phone && <div className="grid size-6 place-items-center rounded bg-[var(--soft)] text-[var(--muted)]" title={item.phone}><Phone className="size-3" /></div>}
                      {item.instagram && <div className="grid size-6 place-items-center rounded bg-[var(--soft)] text-[var(--muted)]" title={item.instagram}><Instagram className="size-3" /></div>}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
