import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/portal-auth";
import { portalLogout } from "../actions";

export default async function PortalAppLayout({ children }: { children: ReactNode }) {
  const portalUser = await getPortalSession();
  if (!portalUser) redirect("/portal/login");

  return (
    <div>
      <header className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/portal" className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">Portal do cliente</Link>
          <div className="flex items-center gap-4">
            <Link href="/portal/suporte" className="text-sm font-bold text-[var(--muted)] hover:text-[var(--carbon)]">Suporte</Link>
            <span className="text-sm font-bold">{portalUser.name}</span>
            <form action={portalLogout}><button type="submit" className="text-sm font-bold text-[var(--muted)] hover:text-[var(--error)]">Sair</button></form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
