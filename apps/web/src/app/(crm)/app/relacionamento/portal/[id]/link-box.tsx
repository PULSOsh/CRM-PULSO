"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

export function LinkBox({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${link}` : link;
  return (
    <div className="flex items-center gap-2">
      <input readOnly value={fullUrl} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-xs outline-none" />
      <button type="button" onClick={() => { navigator.clipboard.writeText(fullUrl); setCopied(true); }} className="secondary-button shrink-0">
        <Copy className="size-4" />{copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
