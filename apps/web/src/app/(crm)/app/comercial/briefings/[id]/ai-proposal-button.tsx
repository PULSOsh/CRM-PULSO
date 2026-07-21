"use client";

import { useState } from "react";
import { generateAIProposal } from "../../propostas/actions";
import { useRouter } from "next/navigation";
import { Bot, Loader2 } from "lucide-react";

export function AIProposalButton({ briefingId }: { briefingId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    setPending(true);
    try {
      const res = await generateAIProposal(briefingId);
      if (res?.error) {
        alert(res.error);
        setPending(false);
      } else if (res?.redirect) {
        router.push(res.redirect);
      }
    } catch (err) {
      alert("Ocorreu um erro ao gerar a proposta.");
      setPending(false);
    }
  }

  return (
    <button 
      onClick={handleGenerate} 
      disabled={pending} 
      className="inline-flex items-center gap-2 rounded-xl bg-[var(--signal)] hover:bg-orange-600 px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
      {pending ? "A IA está gerando..." : "Gerar Proposta com IA"}
    </button>
  );
}
