"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavigation } from "@/lib/nav";

export function MobileNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl border-t border-white/10" />
      <div className="relative grid grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)]">
        {mobileNavigation.map(item => {
          const active = pathname === item.href || (item.href !== "/app/hoje" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`relative flex min-h-16 flex-col items-center justify-center gap-1.5 text-[10px] font-bold transition-colors ${active ? "text-orange-500" : "text-gray-500 hover:text-gray-300"}`}>
              {active && (
                <div className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
              )}
              <div className={`relative ${active ? "opacity-100" : "opacity-70"}`}>
                <Icon className={`size-5 ${active ? "drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" : ""}`} />
                {item.href === "/app/mensagens" && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
