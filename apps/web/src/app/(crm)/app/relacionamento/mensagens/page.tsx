import { PageHeader } from "@/components/page-header";
import { MessageSquareText, Search, Star, Archive, MoreVertical, Send } from "lucide-react";
import { Badge, Input, Button } from "@pulso/ui";

const DUMMY_CHATS = [
  { id: 1, name: "Maria Silva", company: "TechCorp", message: "Gostaria de agendar uma demonstração do software para nossa equipe.", time: "10:30", unread: 2 },
  { id: 2, name: "João Pedro", company: "InovaTech", message: "A proposta está aprovada! Podemos prosseguir com o contrato?", time: "Ontem", unread: 0 },
  { id: 3, name: "Ana Beatriz", company: "StartupX", message: "Obrigada pelo retorno. Vamos analisar internamente.", time: "Segunda", unread: 0 },
  { id: 4, name: "Carlos Mendes", company: "Consultoria Y", message: "Qual o prazo de implementação?", time: "Segunda", unread: 0 }
];

export default function MensagensPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        eyebrow="Relacionamento"
        title="Mensagens"
        description="Inbox unificada (WhatsApp, E-mail, Portal do Cliente)."
      />

      <div className="mt-6 flex flex-1 overflow-hidden rounded-3xl border border-white/10 bg-black/20 ">
        
        {/* Sidebar */}
        <div className="flex w-80 flex-col border-r border-white/10 bg-black/40">
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
              <input 
                placeholder="Buscar mensagens..." 
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[var(--signal)] transition-colors"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {DUMMY_CHATS.map((chat) => (
              <div key={chat.id} className={`flex cursor-pointer gap-3 border-b border-white/5 p-4 transition-colors hover:bg-white/5 ${chat.unread ? "bg-white/5" : ""}`}>
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--signal)]/20 text-[var(--signal)] font-bold">
                  {chat.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`truncate text-sm ${chat.unread ? "font-extrabold text-white" : "font-bold text-gray-300"}`}>{chat.name}</p>
                    <span className="text-[10px] text-gray-500">{chat.time}</span>
                  </div>
                  <p className="truncate text-xs font-medium text-gray-500">{chat.company}</p>
                  <p className={`mt-1 truncate text-xs ${chat.unread ? "font-medium text-gray-300" : "text-gray-500"}`}>{chat.message}</p>
                </div>
                {chat.unread > 0 && (
                  <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--signal)] px-1.5 text-[10px] font-bold text-white">
                    {chat.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="flex flex-1 flex-col bg-black/10">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--signal)]/20 text-[var(--signal)] font-bold">M</div>
              <div>
                <p className="font-extrabold text-white">Maria Silva</p>
                <p className="text-xs text-gray-400">TechCorp • Última vez hoje às 10:35</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="grid size-9 place-items-center rounded-xl hover:bg-white/10 text-gray-400 transition-colors"><Star className="size-4" /></button>
              <button className="grid size-9 place-items-center rounded-xl hover:bg-white/10 text-gray-400 transition-colors"><Archive className="size-4" /></button>
              <button className="grid size-9 place-items-center rounded-xl hover:bg-white/10 text-gray-400 transition-colors"><MoreVertical className="size-4" /></button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex justify-center"><Badge tone="neutral" className="bg-white/5 border-none">Hoje</Badge></div>
            
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white/10 p-4 text-sm text-gray-200">
                Olá! Tudo bem? Gostaria de saber mais sobre os serviços de vocês.
                <span className="mt-1 block text-right text-[10px] text-gray-500">10:28</span>
              </div>
            </div>
            
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[var(--signal)] p-4 text-sm text-white shadow-lg shadow-orange-500/20">
                Olá Maria! Tudo ótimo. Claro, ficarei feliz em apresentar. Tem disponibilidade para uma breve call amanhã?
                <span className="mt-1 block text-right text-[10px] text-white/70">10:29</span>
              </div>
            </div>
            
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white/10 p-4 text-sm text-gray-200">
                Gostaria de agendar uma demonstração do software para nossa equipe.
                <span className="mt-1 block text-right text-[10px] text-gray-500">10:30</span>
              </div>
            </div>
          </div>
          
          {/* Input Area */}
          <div className="border-t border-white/10 bg-black/40 p-4">
            <div className="flex gap-3">
              <input 
                placeholder="Digite sua mensagem..." 
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[var(--signal)] transition-colors"
              />
              <button className="flex items-center gap-2 rounded-xl bg-[var(--signal)] px-5 font-bold text-white transition-all hover:bg-orange-600 shadow-lg shadow-orange-500/20">
                <Send className="size-4" /> Enviar
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
