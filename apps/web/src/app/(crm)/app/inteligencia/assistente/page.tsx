"use client";

import { useState } from "react";
import { Badge, Card } from "@pulso/ui";
import { Bot, BrainCircuit, Send, ShieldCheck, Sparkles, MessageSquarePlus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import ReactMarkdown from "react-markdown";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function AiPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const assistantId = `assistant-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, initialAssistantMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Erro ao se comunicar com a IA.");
      }

      if (!response.body) {
        throw new Error("Resposta da API de IA vazia.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: accumulated } : msg
          )
        );
      }
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: `⚠️ **Erro:** ${err.message || "Desculpe, ocorreu uma falha ao gerar a resposta."}` }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      <PageHeader
        eyebrow="Inteligência assistida"
        title="Assistente de IA"
        description="Sugestões revisáveis para diagnóstico, propostas, projetos, suporte e análise financeira baseadas nos seus dados reais."
      />

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
                <h2 className="font-extrabold text-lg tracking-tight text-[var(--text)]">Copiloto PULSO</h2>
                <p className="text-xs font-medium text-[var(--muted)] flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Conectado aos dados do CRM
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
                <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--muted)]">Analise briefings, consulte oportunidades do funil ou resuma os últimos contratos com o Copiloto conectado ao seu banco de dados.</p>

                <div className="mt-10 grid w-full max-w-xl gap-3 sm:grid-cols-2">
                  {[
                    { label: "Resumir oportunidades no funil", icon: MessageSquarePlus },
                    { label: "Quais são as propostas recentes?", icon: BrainCircuit },
                    { label: "Resumir últimos contratos", icon: Sparkles },
                    { label: "Listar leads operacionais", icon: Bot }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => sendMessage(item.label)}
                        className="group relative overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]/50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--signal)]/50 hover:bg-[var(--signal)]/5 hover:shadow-lg hover:shadow-[var(--signal)]/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--soft)] group-hover:bg-[var(--signal)]/20 group-hover:text-[var(--signal)] transition-colors">
                            <Icon className="size-4 text-[var(--text)] group-hover:text-[var(--signal)]" />
                          </div>
                          <span className="text-sm font-bold text-[var(--text)] transition-colors">{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                      m.role === "user"
                        ? "bg-[var(--signal)] text-white font-semibold shadow-md"
                        : "bg-[var(--soft)] border border-[var(--line)] text-[var(--text)] shadow-lg"
                    }`}
                  >
                    <div className="prose prose-sm prose-invert max-w-none text-[var(--text)] [&_p]:text-[var(--text)] [&_li]:text-[var(--text)] [&_strong]:text-[var(--text)] [&_h1]:text-[var(--text)] [&_h2]:text-[var(--text)] [&_h3]:text-[var(--text)] [&_code]:text-[var(--signal)] [&_code]:bg-[var(--surface)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded">
                      <ReactMarkdown>{m.content || (isLoading ? "Pensando..." : "")}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-[var(--soft)] border border-[var(--line)] px-5 py-4 flex items-center gap-2 text-[var(--muted)]">
                  <Loader2 className="size-4 animate-spin text-[var(--signal)]" /> Consultando banco de dados e gerando resposta...
                </div>
              </div>
            )}
          </div>

          <div className="relative z-10 border-t border-[var(--line)] bg-[var(--surface)]/50 p-6 shrink-0">
            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl flex gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-lg shadow-black/5 focus-within:border-[var(--signal)]/50 focus-within:ring-2 focus-within:ring-[var(--signal)]/20 transition-all">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none"
                placeholder="Pergunte sobre oportunidades, propostas, contratos ou projetos do CRM..."
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="grid h-10 w-12 shrink-0 place-items-center rounded-xl bg-[var(--signal)] text-white shadow-md shadow-[var(--signal)]/20 transition-all hover:bg-[var(--signal)]/90 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Send className="size-4" />
              </button>
            </form>
            <p className="text-center text-[10px] text-[var(--muted)] mt-3">O Copiloto acessa os dados do seu sistema. Considere verificar informações estratégicas.</p>
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
                <h2 className="font-extrabold text-lg text-[var(--text)]">Limites de segurança</h2>
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
                <h2 className="font-extrabold text-lg text-[var(--text)]">Integração Direta</h2>
              </div>
              <p className="text-sm font-medium leading-relaxed text-[var(--muted)]">
                O assistente está conectado em tempo real com as tabelas de Oportunidades, Propostas, Contratos, Leads e Projetos do seu CRM.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
