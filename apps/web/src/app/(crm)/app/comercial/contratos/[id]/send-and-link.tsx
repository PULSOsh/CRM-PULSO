"use client";

import { Copy, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { regenerateContractLink } from "../actions";

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

export function RegenerateContractLink({ contractId }: { contractId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await regenerateContractLink(contractId);
      setLink(result.link);
    });
  }

  if (link) return <LinkBox link={link} />;

  return (
    <button type="button" onClick={handleClick} disabled={pending} className="secondary-button">
      <RefreshCw className="size-4" />{pending ? "Gerando..." : "Regenerar link"}
    </button>
  );
}
