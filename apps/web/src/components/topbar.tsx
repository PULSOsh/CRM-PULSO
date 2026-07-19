"use client";

import { Bell, Command, EyeOff, Menu, Moon, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { PulsoLogo } from "./logo";

export function Topbar() {
  const [privateMode, setPrivateMode] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; }, [dark]);
  useEffect(() => { document.documentElement.dataset.private = privateMode ? "true" : "false"; }, [privateMode]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--line)] bg-[color:var(--paper)/.9] px-4 backdrop-blur md:px-6">
      <div className="lg:hidden"><PulsoLogo compact /></div>
      <button className="grid size-9 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] lg:hidden"><Menu className="size-4" /></button>
      <button className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-left text-sm text-[var(--muted)] shadow-sm md:max-w-xl">
        <Search className="size-4 shrink-0" /><span className="truncate">Buscar clientes, projetos, propostas...</span>
        <span className="ml-auto hidden items-center gap-1 rounded-md border border-[var(--line)] px-2 py-0.5 font-mono text-[10px] md:flex"><Command className="size-3" />K</span>
      </button>
      <button className="grid size-9 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)]" onClick={() => setPrivateMode(v => !v)} title="Ocultar valores">
        <EyeOff className={`size-4 ${privateMode ? "text-[var(--signal)]" : ""}`} />
      </button>
      <button className="grid size-9 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)]" onClick={() => setDark(v => !v)} title="Alternar tema">
        <Moon className={`size-4 ${dark ? "text-[var(--signal)]" : ""}`} />
      </button>
      <button className="relative grid size-9 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)]"><Bell className="size-4" /><span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[var(--signal)]" /></button>
    </header>
  );
}
