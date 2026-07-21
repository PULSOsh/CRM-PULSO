"use client";

import { useState, useTransition } from "react";
import { Badge, Card } from "@pulso/ui";
import {
  LayoutList, LayoutGrid, Phone, Mail, Link as LinkIcon, UserPlus, Target,
  CheckCircle2, Loader2, MapPin, Trash2, TrendingUp, Users, Flame, ExternalLink
} from "lucide-react";
import type { schema } from "@pulso/database";
import {
  convertProspectToLead, convertProspectToOpportunity,
  updateProspectItemStatus, deleteProspectingItem
} from "../actions";
import { ConfirmModal } from "@/components/confirm-modal";

type ProspectingItem = typeof schema.prospectingItems.$inferSelect;

const STATUSES = [
  { id: "not_researched", label: "Não pesquisado", color: "neutral" },
  { id: "researched", label: "Pesquisado (Mapeado)", color: "info" },
  { id: "contacted", label: "Contatado", color: "warning" },
  { id: "waiting_reply", label: "Aguardando resposta", color: "warning" },
  { id: "replied", label: "Respondeu", color: "signal" },
  { id: "meeting_scheduled", label: "Reunião agendada", color: "success" },
  { id: "unqualified", label: "Desqualificado", color: "neutral" },
  { id: "converted", label: "Convertido em Lead/Opp", color: "success" },
] as const;

export function ProspectingView({ items: initialItems }: { items: ProspectingItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [hideConverted, setHideConverted] = useState(true);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Metrics
  const totalLeads = items.length;
  const highFitCount = items.filter(
    (i) =>
      String((i.metadata as any)?.fit || "").toLowerCase().includes("alto") ||
      String((i.metadata as any)?.prioridade || "").toUpperCase() === "A"
  ).length;
  const contactedCount = items.filter((i) =>
    ["contacted", "waiting_reply", "replied"].includes(i.status)
  ).length;
  const convertedCount = items.filter((i) => i.status === "converted").length;

  const displayItems = hideConverted ? items.filter(i => i.status !== "converted") : items;

  const handleConvertToLead = (itemId: string) => {
    setPendingItemId(itemId);
    // Optimistic local update
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: "converted" } : i));
    startTransition(async () => {
      const res = await convertProspectToLead(itemId);
      setPendingItemId(null);
      if (res?.error) {
        setItems(initialItems);
        setErrorMessage(res.error);
      }
    });
  };

  const handleStatusChange = (itemId: string, newStatus: string) => {
    setPendingItemId(itemId);
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: newStatus as any } : i));
    startTransition(async () => {
      await updateProspectItemStatus(itemId, newStatus);
      setPendingItemId(null);
    });
  };

  const confirmDeleteProspectItem = () => {
    if (!deleteTargetId) return;
    const targetId = deleteTargetId;
    setPendingItemId(targetId);
    setItems(prev => prev.filter(i => i.id !== targetId));
    startTransition(async () => {
      await deleteProspectingItem(targetId);
      setPendingItemId(null);
      setDeleteTargetId(null);
    });
  };

  const formatLink = (url?: string | null) => {
    if (!url) return null;
    let href = url;
    if (!href.startsWith("http://") && !href.startsWith("https://")) {
      if (href.startsWith("@")) {
        href = `https://instagram.com/${href.replace(/^@/, "")}`;
      } else {
        href = `https://${href}`;
      }
    }
    return href;
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo Executivo (Painel Estilo Clientes) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-[var(--line)] bg-[var(--surface)] shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Total de Leads</span>
            <div className="grid size-8 place-items-center rounded-xl bg-[var(--soft)] text-[var(--text)]">
              <Users className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-[var(--text)]">{totalLeads}</p>
          <span className="text-[11px] text-[var(--muted)]">Contatos mapeados na lista</span>
        </Card>

        <Card className="p-4 border border-[var(--line)] bg-[var(--surface)] shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Fit Alto / Prio A</span>
            <div className="grid size-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Flame className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">{highFitCount}</p>
          <span className="text-[11px] text-[var(--muted)]">Alta probabilidade de fechamento</span>
        </Card>

        <Card className="p-4 border border-[var(--line)] bg-[var(--surface)] shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Contatados / Respostas</span>
            <div className="grid size-8 place-items-center rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-400">{contactedCount}</p>
          <span className="text-[11px] text-[var(--muted)]">Em cadência de comunicação</span>
        </Card>

        <Card className="p-4 border border-[var(--line)] bg-[var(--surface)] shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Convertidos no CRM</span>
            <div className="grid size-8 place-items-center rounded-xl bg-[var(--signal)]/10 text-[var(--signal)]">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-[var(--signal)]">{convertedCount}</p>
          <span className="text-[11px] text-[var(--muted)]">Viraram Lead ou Oportunidade</span>
        </Card>
      </div>

      {/* Barra de Ferramentas e Alternador de Visão */}
      <div className="flex items-center justify-between">
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

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setHideConverted(!hideConverted)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
              hideConverted 
                ? "border-[var(--signal)]/30 bg-[var(--signal)]/10 text-[var(--signal)]" 
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {hideConverted ? `Ocultando Convertidos (${convertedCount})` : "Exibindo Todos (Inclui Convertidos)"}
          </button>

          <p className="text-xs font-bold text-[var(--muted)]">
            Exibindo <span className="text-[var(--text)] font-extrabold">{displayItems.length}</span> contatos
          </p>
        </div>
      </div>

      {view === "list" ? (
        <Card className="overflow-hidden border border-[var(--line)] bg-[var(--surface)] shadow-lg">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="border-b border-[var(--line)] bg-[var(--soft)] font-mono uppercase tracking-wider text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3.5 font-bold">Contato / Lead</th>
                  <th className="px-4 py-3.5 font-bold">Score & Fit</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-4 py-3.5 font-bold">Local / Situação Digital</th>
                  <th className="px-4 py-3.5 font-bold">Links & Contatos</th>
                  <th className="px-4 py-3.5 text-right font-bold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {displayItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--muted)]">
                      Nenhum contato pendente nesta lista de prospecção.
                    </td>
                  </tr>
                )}
                {displayItems.map((item) => {
                  const meta = (item.metadata as Record<string, any>) || {};
                  const isPending = pendingItemId === item.id;
                  const isConverted = item.status === "converted";
                  const instaHref = formatLink(item.instagram);
                  const webHref = formatLink(item.website);

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

                      <td className="px-4 py-3.5 text-[11px] text-[var(--muted)] space-y-1">
                        {item.phone && (
                          <a
                            href={`https://wa.me/55${item.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[var(--text)] hover:text-[var(--signal)] hover:underline font-medium"
                          >
                            <Phone className="size-3 text-[var(--signal)] shrink-0" /> {item.phone}
                          </a>
                        )}

                        {instaHref && (
                          <a
                            href={instaHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[var(--signal)] font-semibold hover:underline"
                          >
                            <LinkIcon className="size-3 shrink-0" /> {item.instagram}
                          </a>
                        )}

                        {webHref && (
                          <a
                            href={webHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sky-400 font-semibold hover:underline"
                          >
                            <ExternalLink className="size-3 shrink-0" /> Website
                          </a>
                        )}

                        {item.email && (
                          <a
                            href={`mailto:${item.email}`}
                            className="flex items-center gap-1 text-[var(--muted)] hover:text-[var(--text)] hover:underline"
                          >
                            <Mail className="size-3 shrink-0" /> {item.email}
                          </a>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isConverted ? (
                            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                              <CheckCircle2 className="size-3.5" /> Convertido
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleConvertToLead(item.id)}
                                disabled={isPending}
                                title="Tornar Cliente / Lead no CRM"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--signal)] hover:bg-orange-600 font-bold text-xs text-white px-3 py-1.5 shadow-sm transition-all disabled:opacity-50"
                              >
                                {isPending && pendingItemId === item.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <UserPlus className="size-3.5" />
                                )}
                                Tornar Cliente
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setDeleteTargetId(item.id)}
                            disabled={isPending}
                            title="Excluir este item da lista"
                            className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
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
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin h-[calc(100vh-250px)] snap-x">
          {STATUSES.map((status) => {
            const columnItems = displayItems.filter((i) => i.status === status.id);
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
                    const instaHref = formatLink(item.instagram);
                    const webHref = formatLink(item.website);

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

                        {/* Links Clicáveis */}
                        <div className="mt-3 pt-3 border-t border-[var(--line)] flex flex-col gap-1 text-xs">
                          {item.phone && (
                            <a
                              href={`https://wa.me/55${item.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[var(--muted)] hover:text-[var(--signal)] font-medium"
                            >
                              <Phone className="size-3 text-[var(--signal)]" /> {item.phone}
                            </a>
                          )}

                          {instaHref && (
                            <a
                              href={instaHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[var(--signal)] font-semibold hover:underline"
                            >
                              <LinkIcon className="size-3" /> {item.instagram}
                            </a>
                          )}

                          {webHref && (
                            <a
                              href={webHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sky-400 font-semibold hover:underline"
                            >
                              <ExternalLink className="size-3" /> Site próprio
                            </a>
                          )}
                        </div>

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
                                className="flex-1 py-1.5 px-2 rounded-lg bg-[var(--signal)] hover:bg-orange-600 text-white text-[11px] font-bold transition-all text-center shadow-sm"
                              >
                                + Tornar Cliente
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setDeleteTargetId(item.id)}
                            disabled={isPending}
                            title="Excluir lead da lista"
                            className="p-1 text-[var(--muted)] hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
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

      {/* PULSO Custom Confirm Modal for Prospecting */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Excluir Lead da Lista"
        description="Tem certeza que deseja excluir este lead da lista de prospecção?"
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        tone="danger"
        isLoading={isPending}
        onConfirm={confirmDeleteProspectItem}
        onClose={() => setDeleteTargetId(null)}
      />

      {/* PULSO Error Alert Modal */}
      <ConfirmModal
        isOpen={Boolean(errorMessage)}
        title="Aviso"
        description={errorMessage || ""}
        confirmText="Entendido"
        cancelText="Fechar"
        tone="signal"
        onConfirm={() => setErrorMessage(null)}
        onClose={() => setErrorMessage(null)}
      />
    </div>
  );
}
