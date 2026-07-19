"use client";

import { Copy, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { regenerateBriefingLink } from "../actions";

export function RegenerateLink({ briefingId }: { briefingId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await regenerateBriefingLink(briefingId);
      setLink(typeof window !== "undefined" ? `${window.location.origin}${result.link}` : result.link);
    });
  }

  if (link) {
    return (
      <div className="flex items-center gap-2">
        <input readOnly value={link} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-xs outline-none" />
        <button type="button" onClick={() => navigator.clipboard.writeText(link)} className="secondary-button shrink-0"><Copy className="size-4" /></button>
      </div>
    );
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending} className="secondary-button">
      <RefreshCw className="size-4" />{pending ? "Gerando..." : "Regenerar link"}
    </button>
  );
}
