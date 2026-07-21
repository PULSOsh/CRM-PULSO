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
    <aside className={`hidden h-screen shrink-0 border-r border-white/10 bg-[#11110f] lg:sticky lg:top-0 lg:flex lg:flex-col ${collapsed ? "w-[82px]" : "w-[274px]"} transition-[width] duration-300 relative overflow-hidden`}>
      {/* Immersive Sidebar Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] pointer-events-none rounded-full" />
      
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-5 relative z-10">
        <PulsoLogo compact={collapsed} />
        <button className="grid size-8 place-items-center rounded-lg border border-white/10 text-gray-500 transition-colors hover:bg-white/10 hover:text-white" onClick={() => setCollapsed(v => !v)} aria-label="Recolher menu">
          <ChevronLeft className={`size-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>
      
      <nav className="scrollbar-thin flex-1 overflow-y-auto p-3 relative z-10">
        {navigation.map(group => (
          <div key={group.title} className="mb-6">
            {!collapsed && <p className="px-3 pb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500/80">{group.title}</p>}
            <div className="space-y-1">
              {group.items.map(item => {
                const active = pathname === item.href || (item.href !== "/app/hoje" && pathname.startsWith(item.href));
                const Icon = item.icon;
                const isNotification = item.href === "/app/inteligencia/notificacoes";
                
                return (
                  <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-all duration-300 ${active ? "bg-orange-500/10 text-white shadow-[0_0_15px_rgba(249,115,22,0.1)] border border-orange-500/20" : "text-gray-400 border border-transparent hover:bg-white/5 hover:text-white"} ${collapsed ? "justify-center" : ""}`}>
                    
                    {active && <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)]" />}
                    
                    <Icon className={`size-[18px] transition-colors ${active ? "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "text-gray-500 group-hover:text-gray-300"}`} />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    
                    {!collapsed && isNotification && unreadCount > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[9px] font-black text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                    {collapsed && isNotification && unreadCount > 0 && (
                      <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      
      <div className="border-t border-white/10 p-3 relative z-10 bg-black/20 backdrop-blur-md">
        <button className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-gray-400 transition-colors hover:bg-white/5 hover:text-white ${collapsed ? "justify-center" : ""}`}>
          <LifeBuoy className="size-[18px]" />{!collapsed && <span>Central de ajuda</span>}
        </button>
        <button onClick={handleLogout} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-gray-400 transition-colors hover:bg-white/5 hover:text-rose-400 ${collapsed ? "justify-center" : ""}`}>
          <LogOut className="size-[18px]" />{!collapsed && <span>Sair</span>}
        </button>
        
        <div className={`mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 shadow-inner ${collapsed ? "justify-center" : ""}`}>
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange-500 text-sm font-black text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]">{initial}</div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-white">{user.name}</p>
              <p className="truncate text-[10px] font-bold uppercase tracking-widest text-orange-500/80">Administrador</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
