"use client";

import { useState, useTransition } from "react";
import { registerPayment, reverseEntry } from "./actions";

export function EntryActions({ entryId, canPay }: { entryId: string; canPay: boolean }) {
  const [mode, setMode] = useState<"none" | "pay" | "reverse">("none");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submitPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try { await registerPayment(entryId, formData); setMode("none"); }
      catch (err) { setError(err instanceof Error ? err.message : "Não foi possível registrar."); }
    });
  }

  function submitReversal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try { await reverseEntry(entryId, formData); setMode("none"); }
      catch (err) { setError(err instanceof Error ? err.message : "Não foi possível estornar."); }
    });
  }

  if (mode === "pay") {
    return (
      <form onSubmit={submitPayment} className="flex flex-wrap items-end gap-2 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3">
        <div><label className="mb-1 block text-[10px] font-bold text-[var(--muted)]">Valor</label><input name="amount" required placeholder="0,00" className="w-28 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs outline-none" /></div>
        <div><label className="mb-1 block text-[10px] font-bold text-[var(--muted)]">Data</label><input name="paidAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs outline-none" /></div>
        <div>
          <label className="mb-1 block text-[10px] font-bold text-[var(--muted)]">Método</label>
          <select name="paymentMethod" required className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs outline-none">
            <option value="pix">PIX</option><option value="dinheiro">Dinheiro</option><option value="cartao">Cartão</option><option value="transferencia">Transferência</option><option value="outro">Outro</option>
          </select>
        </div>
        <button type="submit" disabled={pending} className="secondary-button px-3 py-1.5 text-xs">{pending ? "..." : "Confirmar"}</button>
        <button type="button" onClick={() => setMode("none")} className="text-xs font-bold text-[var(--muted)]">Cancelar</button>
        {error && <p role="alert" className="w-full text-xs font-semibold text-[#b3261e]">{error}</p>}
      </form>
    );
  }

  if (mode === "reverse") {
    return (
      <form onSubmit={submitReversal} className="flex flex-wrap items-end gap-2 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3">
        <input name="reason" required placeholder="Motivo do estorno" className="min-w-[180px] flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs outline-none" />
        <button type="submit" disabled={pending} className="secondary-button px-3 py-1.5 text-xs">{pending ? "..." : "Confirmar estorno"}</button>
        <button type="button" onClick={() => setMode("none")} className="text-xs font-bold text-[var(--muted)]">Cancelar</button>
        {error && <p role="alert" className="w-full text-xs font-semibold text-[#b3261e]">{error}</p>}
      </form>
    );
  }

  return (
    <div className="flex gap-2">
      {canPay && <button type="button" onClick={() => setMode("pay")} className="secondary-button px-3 py-1.5 text-xs">Registrar baixa</button>}
      <button type="button" onClick={() => setMode("reverse")} className="text-xs font-bold text-[var(--muted)] hover:text-[#b3261e]">Estornar</button>
    </div>
  );
}
