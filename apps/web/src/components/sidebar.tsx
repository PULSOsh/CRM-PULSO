"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, LifeBuoy, LogOut } from "lucide-react";
import { useState } from "react";
import { navigation } from "@/lib/nav";
import { authClient } from "@/lib/auth-client";
import { PulsoLogo } from "./logo";

export function Sidebar({ user, unreadCount = 0 }: { user: { name: string; email: string }, unreadCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className={`hidden h-screen shrink-0 border-r border-[var(--line)] bg-[var(--surface)] lg:sticky lg:top-0 lg:flex lg:flex-col ${collapsed ? "w-[82px]" : "w-[274px]"} transition-[width] duration-200`}>
      <div className="flex h-20 items-center justify-between border-b border-[var(--line)] px-5">
        <PulsoLogo compact={collapsed} />
        <button className="grid size-8 place-items-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--soft)]" onClick={() => setCollapsed(v => !v)} aria-label="Recolher menu">
          <ChevronLeft className={`size-4 transition ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>
      <nav className="scrollbar-thin flex-1 overflow-y-auto p-3">
        {navigation.map(group => (
          <div key={group.title} className="mb-5">
            {!collapsed && <p className="px-3 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{group.title}</p>}
            <div className="space-y-1">
              {group.items.map(item => {
                const active = pathname === item.href;
                const Icon = item.icon;
                const isNotification = item.href === "/app/inteligencia/notificacoes";
                return (
                  <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-[var(--carbon)] text-white" : "text-[var(--muted-strong)] hover:bg-[var(--soft)] hover:text-[var(--carbon)]"} ${collapsed ? "justify-center" : ""}`}>
                    <Icon className={`size-[18px] ${active ? "text-[var(--signal)]" : ""}`} />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {!collapsed && isNotification && unreadCount > 0 && (
                      <span className="flex h-5 items-center justify-center rounded-full bg-red-500 px-2 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                    {collapsed && isNotification && unreadCount > 0 && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-[var(--line)] p-3">
        <button className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--muted-strong)] hover:bg-[var(--soft)] ${collapsed ? "justify-center" : ""}`}>
          <LifeBuoy className="size-[18px]" />{!collapsed && <span>Central de ajuda</span>}
        </button>
        <button onClick={handleLogout} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--muted-strong)] hover:bg-[var(--soft)] ${collapsed ? "justify-center" : ""}`}>
          <LogOut className="size-[18px]" />{!collapsed && <span>Sair</span>}
        </button>
        <div className={`mt-2 flex items-center gap-3 rounded-xl bg-[var(--soft)] p-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--signal)] text-xs font-black text-white">{initial}</div>
          {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-bold">{user.name}</p><p className="truncate text-xs text-[var(--muted)]">Administrador</p></div>}
        </div>
      </div>
    </aside>
  );
}
