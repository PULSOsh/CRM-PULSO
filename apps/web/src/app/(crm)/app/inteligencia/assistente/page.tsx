import { Badge, Card } from "@pulso/ui";
import { Bot, BrainCircuit, Send, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function AiPage() {
  return (
    <>
      <PageHeader eyebrow="Inteligência assistida" title="Assistente de IA" description="Sugestões revisáveis para diagnóstico, propostas, projetos, suporte e análise financeira." />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card className="flex min-h-[600px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
            <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-[var(--carbon)] text-white"><Bot className="size-5 text-[var(--signal)]" /></div><div><h2 className="font-extrabold">Copiloto PULSO</h2><p className="text-xs text-[var(--muted)]">Provider desativado no preview</p></div></div>
            <Badge tone="neutral">Revisão obrigatória</Badge>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="grid size-16 place-items-center rounded-2xl bg-[var(--soft)]"><BrainCircuit className="size-7 text-[var(--signal)]" /></div>
            <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.04em]">Como posso ajudar?</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">Analise um briefing, crie o primeiro rascunho de proposta ou resuma riscos de um projeto.</p>
            <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-2">
              {["Analisar briefing","Criar escopo","Resumir projeto","Explicar financeiro"].map(item=><button key={item} className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3 text-sm font-bold hover:border-[var(--signal)]">{item}</button>)}
            </div>
          </div>
          <div className="border-t border-[var(--line)] p-4"><div className="flex gap-2 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-2"><input className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" placeholder="Pergunte sobre um registro do CRM..." /><button className="grid size-10 place-items-center rounded-lg bg-[var(--signal)] text-white"><Send className="size-4" /></button></div></div>
        </Card>
        <div className="space-y-4">
          <Card className="p-5"><div className="flex items-center gap-3"><ShieldCheck className="size-5 text-[var(--signal)]" /><h2 className="font-extrabold">Limites de segurança</h2></div><ul className="mt-4 space-y-3 text-sm leading-5 text-[var(--muted)]"><li>• Não envia mensagens ou documentos.</li><li>• Não publica propostas.</li><li>• Não altera valores ou descontos.</li><li>• Não confirma pagamentos.</li><li>• Não conclui projetos.</li></ul></Card>
          <Card className="p-5"><div className="flex items-center gap-3"><Sparkles className="size-5 text-[var(--signal)]" /><h2 className="font-extrabold">Arquitetura</h2></div><p className="mt-3 text-sm leading-6 text-[var(--muted)]">OpenAI, Anthropic e Gemini ficam atrás de uma camada substituível, com histórico, custo e fallback opcional.</p></Card>
        </div>
      </div>
    </>
  );
}
