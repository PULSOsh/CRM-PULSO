"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error("App boundary error:", error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center bg-[var(--paper)] p-6 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-[var(--signal)]/10">
        <AlertCircle className="size-8 text-[var(--signal)]" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-[var(--carbon)]">Ocorreu um erro inesperado</h2>
      <p className="mb-8 max-w-md text-sm text-[var(--muted)]">
        Não foi possível carregar esta página. Tente recarregar ou volte mais tarde. Se o problema persistir, contate o suporte.
      </p>
      <button 
        onClick={() => reset()}
        className="primary-button"
      >
        Recarregar
      </button>
    </div>
  );
}
