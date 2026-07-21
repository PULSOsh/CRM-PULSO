"use client";

import { Badge, Card } from "@pulso/ui";
import { Bot, BrainCircuit, Send, ShieldCheck, Sparkles, MessageSquarePlus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";

export default function AiPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <>
      <PageHeader eyebrow="Inteligência assistida" title="Assistente de IA" description="Sugestões revisáveis para diagnóstico, propostas, projetos, suporte e análise financeira." />
      
      <div className="grid gap-6 xl:grid-cols-[1fr_340px] mt-6">
        <Card className="relative flex min-h-[650px] flex-col overflow-hidden border border-[var(--line)] bg-[var(--surface)] shadow-2xl shadow-black/10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--signal)]/5 rounded-full blur-[100px] pointer-events-none -mr-40 -mt-40"></div>
          
          <div className="relative z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface)]/50 px-6 py-5 shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[var(--carbon)] to-[#1a1a1a] border border-[var(--line)] shadow-lg">
                <Bot className="size-6 text-[var(--signal)]" />
                <div className="absolute -bottom-1 -right-1 size-3.5 rounded-full border-2 border-[var(--surface)] bg-emerald-500"></div>
              </div>
              <div>
                <h2 className="font-extrabold text-lg tracking-tight">Copiloto PULSO</h2>
                <p className="text-xs font-medium text-[var(--muted)] flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                  Online e pronto
                </p>
              </div>
            </div>
            <Badge tone="neutral" className="shadow-sm border border-[var(--line)]">Revisão obrigatória</Badge>
          </div>
          
          <div className="relative z-10 flex flex-1 flex-col overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="relative grid size-20 place-items-center rounded-3xl bg-[var(--signal)]/10 border border-[var(--signal)]/20 shadow-[0_0_30px_rgba(var(--signal-rgb),0.15)]">
                  <BrainCircuit className="size-10 text-[var(--signal)]" />
                  <div className="absolute inset-0 rounded-3xl border border-[var(--signal)]/30 animate-pulse"></div>
                </div>
                <h3 className="mt-8 text-3xl font-black tracking-tight text-[var(--text)]">Como posso ajudar?</h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--muted)]">Analise um briefing, crie o primeiro rascunho de proposta ou resuma riscos de um projeto com nossa IA treinada para o contexto do CRM.</p>
                
                <div className="mt-10 grid w-full max-w-xl gap-3 sm:grid-cols-2">
                  {[
                    { label: "Analisar briefing", icon: MessageSquarePlus },
                    { label: "Criar escopo", icon: BrainCircuit },
                    { label: "Resumir projeto", icon: Sparkles },
                    { label: "Explicar financeiro", icon: Bot }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button key={item.label} onClick={() => handleInputChange({ target: { value: item.label } } as any)} className="group relative overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]/50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--signal)]/50 hover:bg-[var(--signal)]/5 hover:shadow-lg hover:shadow-[var(--signal)]/10">
                        <div className="flex items-center gap-3">
                          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--soft)] group-hover:bg-[var(--signal)]/20 group-hover:text-[var(--signal)] transition-colors">
                            <Icon className="size-4" />
                          </div>
                          <span className="text-sm font-bold group-hover:text-[var(--text)] transition-colors">{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${m.role === 'user' ? 'bg-[var(--signal)] text-white font-medium' : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--text)]'}`}>
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-[var(--surface)] border border-[var(--line)] px-5 py-4 flex items-center gap-2 text-[var(--muted)]">
                  <Loader2 className="size-4 animate-spin" /> Pensando...
                </div>
              </div>
            )}
          </div>
          
          <div className="relative z-10 border-t border-[var(--line)] bg-[var(--surface)]/50 p-6 shrink-0">
            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl flex gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-lg shadow-black/5 focus-within:border-[var(--signal)]/50 focus-within:ring-2 focus-within:ring-[var(--signal)]/20 transition-all">
              <input value={input} onChange={handleInputChange} disabled={isLoading} className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none" placeholder="Pergunte sobre um registro do CRM ou dê um comando..." />
              <button type="submit" disabled={isLoading || !input.trim()} className="grid h-10 w-12 shrink-0 place-items-center rounded-xl bg-[var(--signal)] text-white shadow-md shadow-[var(--signal)]/20 transition-all hover:bg-[var(--signal)]/90 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none">
                <Send className="size-4" />
              </button>
            </form>
            <p className="text-center text-[10px] text-[var(--muted)] mt-3">O Copiloto pode cometer erros. Considere verificar informações importantes.</p>
          </div>
        </Card>
        
        <div className="space-y-5">
          <Card className="relative overflow-hidden p-6 border border-[var(--line)] bg-[var(--surface)] transition-all hover:border-[var(--line)]/80">
            <div className="absolute -right-6 -top-6 size-24 rounded-full bg-[var(--warning)]/5 blur-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="grid size-10 place-items-center rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/20">
                  <ShieldCheck className="size-5 text-[var(--warning)]" />
                </div>
                <h2 className="font-extrabold text-lg">Limites de segurança</h2>
              </div>
              <ul className="space-y-3 text-sm font-medium leading-relaxed text-[var(--muted)]">
                <li className="flex items-start gap-2"><div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--muted)]"></div> Não envia mensagens ou documentos.</li>
                <li className="flex items-start gap-2"><div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--muted)]"></div> Não publica propostas.</li>
                <li className="flex items-start gap-2"><div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--muted)]"></div> Não altera valores ou descontos.</li>
                <li className="flex items-start gap-2"><div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--muted)]"></div> Não confirma pagamentos.</li>
                <li className="flex items-start gap-2"><div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--muted)]"></div> Não conclui projetos.</li>
              </ul>
            </div>
          </Card>
          
          <Card className="relative overflow-hidden p-6 border border-[var(--line)] bg-[var(--surface)] transition-all hover:border-[var(--signal)]/30 hover:shadow-lg hover:shadow-[var(--signal)]/5 group">
            <div className="absolute -right-6 -bottom-6 size-32 rounded-full bg-[var(--signal)]/5 blur-2xl group-hover:bg-[var(--signal)]/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="grid size-10 place-items-center rounded-xl bg-[var(--signal)]/10 border border-[var(--signal)]/20 group-hover:scale-110 transition-transform">
                  <Sparkles className="size-5 text-[var(--signal)]" />
                </div>
                <h2 className="font-extrabold text-lg">Arquitetura</h2>
              </div>
              <p className="text-sm font-medium leading-relaxed text-[var(--muted)]">
                OpenAI, Anthropic e Gemini ficam atrás de uma camada substituível, com histórico, controle de custo e fallback automático.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
