import { WifiOff } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Você está offline | PULSO",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface)] p-6 text-center">
      <div className="grid size-20 place-items-center rounded-2xl bg-[var(--soft)] text-[var(--muted)]">
        <WifiOff className="size-8" />
      </div>
      <h1 className="mt-8 text-2xl font-extrabold tracking-tight">Sem conexão</h1>
      <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--muted)]">
        Você está offline no momento. O PULSO CRM precisa de conexão com a internet para sincronizar dados.
      </p>
      <Link href="/app/hoje" className="primary-button mt-8">
        Tentar novamente
      </Link>
    </div>
  );
}
