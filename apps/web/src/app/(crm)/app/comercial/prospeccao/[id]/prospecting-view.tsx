"use client";

import { useState, useTransition } from "react";
import { Badge, Card } from "@pulso/ui";
import { LayoutList, LayoutGrid, Phone, Mail, Link as LinkIcon, UserPlus, Target, CheckCircle2, ChevronRight, Loader2, Sparkles, MapPin } from "lucide-react";
import type { schema } from "@pulso/database";
import { convertProspectToLead, convertProspectToOpportunity, updateProspectItemStatus } from "../actions";

type ProspectingItem = typeof schema.prospectingItems.$inferSelect;

const STATUSES = [
  { id: "not_researched", label: "Não pesquisado", color: "neutral" },
  { id: "researched", label: "Pesquisado (Mapeado)", color: "info" },
  { id: "contacted", label: "Contatado", color: "warning" },
  { id: "waiting_reply", label: "Aguardando Resposta", color: "warning" },
  { id: "replied", label: "Respondeu", color: "success" },
  { id: "not_interested", label: "Sem interesse", color: "error" },
  { id: "converted", label: "Convertido", color: "success" },
] as const;

export function ProspectingView({ items }: { items: ProspectingItem[] }) {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleConvertToLead = (itemId: string) => {
    setPendingItemId(itemId);
    startTransition(async () => {
      const res = await convertProspectToLead(itemId);
      setPendingItemId(null);
      if (res?.error) alert(res.error);
    });
  };

  const handleConvertToOpportunity = (itemId: string) => {
    setPendingItemId(itemId);
    startTransition(async () => {
      const res = await convertProspectToOpportunity(itemId);
      setPendingItemId(null);
      if (res?.error) alert(res.error);
    });
  };

  const handleStatusChange = (itemId: string, newStatus: string) => {
    setPendingItemId(itemId);
    startTransition(async () => {
      await updateProspectItemStatus(itemId, newStatus);
      setPendingItemId(null);
    });
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1">
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              view === "list"
                ? "bg-[var(--signal)] text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            <LayoutList className="size-3.5" /> Lista
          </button>
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              view === "kanban"
                ? "bg-[var(--signal)] text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            <LayoutGrid className="size-3.5" /> Kanban
          </button>
        </div>

        <p className="text-xs font-bold text-[var(--muted)]">
          Total: <span className="text-[var(--text)] font-extrabold">{items.length}</span> contatos
        </p>
      </div>

      {view === "list" ? (
        <Card className="overflow-hidden border border-[var(--line)] bg-[var(--surface)] shadow-lg">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[950px] text-left text-xs">
              <thead className="border-b border-[var(--line)] bg-[var(--soft)] font-mono uppercase tracking-wider text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3.5 font-bold">Contato / Lead</th>
                  <th className="px-4 py-3.5 font-bold">Score & Fit</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-4 py-3.5 font-bold">Local / Situação</th>
                  <th className="px-4 py-3.5 font-bold">Contatos</th>
                  <th className="px-4 py-3.5 text-right font-bold">Ações de Conversão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--muted)]">
                      Nenhum contato nesta lista de prospecção.
                    </td>
                  </tr>
                )}
                {items.map((item) => {
                  const meta = (item.metadata as Record<string, any>) || {};
                  const isPending = pendingItemId === item.id;
                  const isConverted = item.status === "converted";

                  return (
                    <tr key={item.id} className="group hover:bg-[var(--soft)]/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-extrabold text-sm text-[var(--text)] block">{item.name}</span>
                        {item.companyName && (
                          <span className="text-[11px] font-medium text-[var(--muted)]">{item.companyName}</span>
                        )}
                        {meta.meta30Dias && (
                          <span className="mt-1 inline-block text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">
                            Meta: {meta.meta30Dias}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {meta.score && (
                            <span className="font-extrabold text-[11px] bg-[var(--signal)]/10 text-[var(--signal)] border border-[var(--signal)]/20 px-2 py-0.5 rounded-md">
                              Score {meta.score}
                            </span>
                          )}
                          {meta.fit && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                String(meta.fit).toLowerCase().includes("alto")
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                              }`}
                            >
                              Fit: {meta.fit}
                            </span>
                          )}
                          {meta.prioridade && (
                            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                              Prio {meta.prioridade}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <select
                          value={item.status}
                          disabled={isPending || isConverted}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className="bg-[var(--soft)] border border-[var(--line)] text-[var(--text)] text-xs font-semibold rounded-lg px-2.5 py-1 outline-none focus:border-[var(--signal)] disabled:opacity-50"
                        >
                          {STATUSES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3.5 text-[11px] text-[var(--muted)]">
                        {meta.cidade && (
                          <div className="flex items-center gap-1 text-[var(--text)] font-medium">
                            <MapPin className="size-3 text-[var(--signal)] shrink-0" />
                            {meta.cidade}
                          </div>
                        )}
                        {meta.situacaoDigital && (
                          <p className="mt-0.5 truncate max-w-[200px]" title={meta.situacaoDigital}>
                            {meta.situacaoDigital}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-[11px] text-[var(--muted)] space-y-0.5">
                        {item.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="size-3 text-[var(--muted)] shrink-0" /> {item.phone}
                          </div>
                        )}
                        {item.instagram && (
                          <div className="flex items-center gap-1 text-[var(--signal)]">
                            <LinkIcon className="size-3 shrink-0" /> @{item.instagram.replace(/^@/, "")}
                          </div>
                        )}
                        {item.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="size-3 text-[var(--muted)] shrink-0" /> {item.email}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {isConverted ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                            <CheckCircle2 className="size-3.5" /> Convertido
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleConvertToLead(item.id)}
                              disabled={isPending}
                              title="Converter em Lead no CRM"
                              className="inline-flex items-center gap-1 rounded-xl bg-[var(--soft)] hover:bg-[var(--signal)] hover:text-white border border-[var(--line)] px-2.5 py-1.5 font-bold text-[11px] text-[var(--text)] transition-all disabled:opacity-50"
                            >
                              {isPending && pendingItemId === item.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <UserPlus className="size-3" />
                              )}
                              Lead
                            </button>

                            <button
                              onClick={() => handleConvertToOpportunity(item.id)}
                              disabled={isPending}
                              title="Criar Oportunidade Direta no Funil"
                              className="inline-flex items-center gap-1 rounded-xl bg-[var(--signal)] hover:bg-orange-600 font-bold text-[11px] text-white px-3 py-1.5 shadow-sm shadow-[var(--signal)]/20 transition-all disabled:opacity-50"
                            >
                              {isPending && pendingItemId === item.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Target className="size-3" />
                              )}
                              Oportunidade
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Kanban View */
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin h-[calc(100vh-210px)] snap-x">
          {STATUSES.map((status) => {
            const columnItems = items.filter((i) => i.status === status.id);
            return (
              <div
                key={status.id}
                className="flex w-[320px] shrink-0 flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-md snap-start"
              >
                <div className="mb-3 flex items-center justify-between px-2 py-1">
                  <span className="font-extrabold text-sm text-[var(--text)]">{status.label}</span>
                  <Badge tone={status.color as any}>{columnItems.length}</Badge>
                </div>

                <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
                  {columnItems.length === 0 && (
                    <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-[var(--muted)] border border-dashed border-[var(--line)] rounded-xl">
                      Nenhum contato
                    </div>
                  )}

                  {columnItems.map((item) => {
                    const meta = (item.metadata as Record<string, any>) || {};
                    const isPending = pendingItemId === item.id;
                    const isConverted = item.status === "converted";

                    return (
                      <Card
                        key={item.id}
                        className="p-4 border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--signal)]/40 transition-all shadow-md group relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-[var(--text)] group-hover:text-[var(--signal)] transition-colors leading-tight">
                              {item.name}
                            </h4>
                            {item.companyName && (
                              <p className="text-xs text-[var(--muted)] mt-0.5">{item.companyName}</p>
                            )}
                          </div>
                          {meta.score && (
                            <span className="shrink-0 text-[10px] font-extrabold bg-[var(--signal)]/10 text-[var(--signal)] px-2 py-0.5 rounded border border-[var(--signal)]/20">
                              Score {meta.score}
                            </span>
                          )}
                        </div>

                        {meta.cidade && (
                          <p className="mt-2 text-xs text-[var(--muted)] flex items-center gap-1">
                            <MapPin className="size-3 text-[var(--signal)]" /> {meta.cidade}
                          </p>
                        )}

                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          {meta.fit && (
                            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              Fit: {meta.fit}
                            </span>
                          )}
                          {meta.prioridade && (
                            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              Prio: {meta.prioridade}
                            </span>
                          )}
                        </div>

                        {item.phone && (
                          <div className="mt-3 pt-3 border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--muted)]">
                            <span className="flex items-center gap-1"><Phone className="size-3" /> {item.phone}</span>
                            {item.instagram && (
                              <span className="text-[var(--signal)] font-semibold">@{item.instagram.replace(/^@/, "")}</span>
                            )}
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-[var(--line)] flex items-center justify-between gap-2">
                          {isConverted ? (
                            <span className="text-[11px] font-extrabold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="size-3.5" /> Convertido
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleConvertToLead(item.id)}
                                disabled={isPending}
                                className="flex-1 py-1 px-2 rounded-lg bg-[var(--soft)] hover:bg-[var(--signal)] hover:text-white text-[11px] font-bold transition-all text-center"
                              >
                                + Lead
                              </button>
                              <button
                                onClick={() => handleConvertToOpportunity(item.id)}
                                disabled={isPending}
                                className="flex-1 py-1 px-2 rounded-lg bg-[var(--signal)] hover:bg-orange-600 text-white text-[11px] font-bold transition-all text-center shadow-sm"
                              >
                                + Oportunidade
                              </button>
                            </>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
