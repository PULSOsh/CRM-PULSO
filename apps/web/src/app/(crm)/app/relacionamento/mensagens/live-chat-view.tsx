"use client";

import { useState, useTransition } from "react";
import { Search, Send, User, MessageSquare, Phone, Mail, FileText, ArrowLeft } from "lucide-react";
import { Badge } from "@pulso/ui";

type ClientItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  service: string | null;
  status: string;
  createdAt: Date;
};

type ActivityItem = {
  id: string;
  entityId: string;
  type: string;
  summary: string;
  createdBy: string;
  occurredAt: Date;
};

export function LiveChatView({
  clients,
  initialActivities,
  addActivityAction
}: {
  clients: ClientItem[];
  initialActivities: ActivityItem[];
  addActivityAction: (leadId: string, message: string) => Promise<void>;
}) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id || null);
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [isPending, startTransition] = useTransition();
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const clientActivities = activities.filter(a => a.entityId === selectedClientId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedClientId) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    // Dynamic Optimistic Update
    const optActivity: ActivityItem = {
      id: "temp-" + Date.now(),
      entityId: selectedClientId,
      type: "note",
      summary: messageText,
      createdBy: "você",
      occurredAt: new Date()
    };
    setActivities(prev => [optActivity, ...prev]);

    startTransition(async () => {
      await addActivityAction(selectedClientId, messageText);
    });
  };

  return (
    <div className="mt-6 flex flex-1 overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] h-[calc(100vh-14rem)]">
      
      {/* Sidebar List */}
      <div className={`w-full md:w-80 flex-col border-r border-[var(--line)] bg-[var(--soft)]/50 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-[var(--line)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente ou empresa..." 
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] py-2 pl-9 pr-4 text-xs text-[var(--text)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--signal)] transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filteredClients.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--muted)]">Nenhum cliente encontrado.</div>
          ) : (
            filteredClients.map((client) => {
              const active = client.id === selectedClientId;
              const lastAct = activities.find(a => a.entityId === client.id);

              return (
                <div 
                  key={client.id} 
                  onClick={() => {
                    setSelectedClientId(client.id);
                    setMobileShowChat(true);
                  }}
                  className={`flex cursor-pointer gap-3 border-b border-[var(--line)]/50 p-4 transition-all hover:bg-[var(--line)]/20 ${active ? "bg-[var(--signal)]/10 border-l-4 border-l-[var(--signal)]" : ""}`}
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--signal)]/20 text-[var(--signal)] font-black text-sm">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-xs font-bold text-[var(--text)]">{client.name}</p>
                      <span className="text-[9px] text-[var(--muted)] font-mono">
                        {new Date(client.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="truncate text-[11px] font-medium text-[var(--muted)]">{client.companyName || "Pessoa Física"}</p>
                    <p className="mt-1 truncate text-[11px] text-[var(--muted)]">
                      {lastAct ? lastAct.summary : (client.service ? `Serviço: ${client.service}` : "Nenhuma mensagem")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Chat / Timeline Area */}
      <div className={`flex-1 flex-col bg-[var(--surface)] ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedClient ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--soft)]/30 p-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden grid size-8 place-items-center rounded-lg bg-[var(--line)] text-[var(--text)]"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--signal)]/20 text-[var(--signal)] font-black">
                  {selectedClient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm text-[var(--text)]">{selectedClient.name}</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {selectedClient.companyName || "Sem empresa"} • {selectedClient.email || selectedClient.phone || "Sem contato direto"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge tone="signal">{selectedClient.status.toUpperCase()}</Badge>
              </div>
            </div>
            
            {/* Messages / Interaction Timeline */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {clientActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 text-[var(--muted)]">
                  <MessageSquare className="size-8 mb-2 opacity-50 text-[var(--signal)]" />
                  <p className="text-xs font-bold text-[var(--text)]">Inicie o histórico de relacionamento</p>
                  <p className="text-[11px] mt-1 max-w-xs">Envie uma mensagem ou registre uma anotação de reunião/contato para este cliente.</p>
                </div>
              ) : (
                clientActivities.map((act) => {
                  const isUserNote = act.createdBy === "você" || act.createdBy === "user";

                  return (
                    <div key={act.id} className={`flex ${isUserNote ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl p-4 text-xs shadow-sm ${
                        isUserNote 
                          ? "rounded-tr-sm bg-[var(--signal)] text-white" 
                          : "rounded-tl-sm bg-[var(--soft)] border border-[var(--line)] text-[var(--text)]"
                      }`}>
                        <div className="flex items-center gap-1 mb-1 opacity-75 font-mono text-[9px]">
                          <span>{act.createdBy}</span> • <span>{new Date(act.occurredAt).toLocaleString("pt-BR")}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{act.summary}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="border-t border-[var(--line)] bg-[var(--soft)]/50 p-4">
              <div className="flex gap-3">
                <input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem, nota de reunião ou atualização..." 
                  className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-xs text-[var(--text)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--signal)] transition-colors"
                />
                <button 
                  type="submit"
                  disabled={isPending || !newMessage.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[var(--signal)] px-5 py-2.5 font-bold text-xs text-white transition-all hover:bg-orange-600 shadow-md shadow-orange-500/20 disabled:opacity-50"
                >
                  <Send className="size-3.5" /> Enviar
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-[var(--muted)]">
            <User className="size-10 mb-2 opacity-50" />
            <p className="text-sm font-bold text-[var(--text)]">Nenhum cliente selecionado</p>
          </div>
        )}
      </div>
      
    </div>
  );
}
