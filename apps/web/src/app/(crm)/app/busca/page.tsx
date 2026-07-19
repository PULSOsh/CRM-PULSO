import { Search } from "lucide-react";
import { Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";

export default function SearchPage() {
  return (
    <>
      <PageHeader eyebrow="Ctrl + K" title="Busca global" description="Encontre qualquer cliente, projeto, proposta, cobrança, arquivo ou tarefa." />
      <Card className="mx-auto max-w-3xl p-4">
        <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-3"><Search className="size-5 text-[var(--muted)]" /><input className="min-w-0 flex-1 bg-transparent text-lg outline-none" placeholder="Buscar no CRM..." autoFocus /></div>
        <div className="p-8 text-center text-sm text-[var(--muted)]">Digite um nome, código ou ação. Exemplo: <strong className="text-[var(--carbon)]">PROP-2026-0012</strong>.</div>
      </Card>
    </>
  );
}
