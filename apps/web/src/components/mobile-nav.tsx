"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavigation } from "@/lib/nav";

export function MobileNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--line)] bg-[var(--surface)] px-1 pb-[env(safe-area-inset-bottom)] lg:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {mobileNavigation.map(item => {
        const active = pathname === item.href || (item.href !== "/app/hoje" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${active ? "text-[var(--signal)]" : "text-[var(--muted)] hover:text-[var(--carbon)]"}`}>
            <div className="relative">
              <Icon className="size-5" />
              {item.href === "/app/inteligencia/notificacoes" && unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white border-2 border-[var(--surface)]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
