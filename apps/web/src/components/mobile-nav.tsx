"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavigation } from "@/lib/nav";

export function MobileNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--line)] bg-[var(--surface)] px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
      {mobileNavigation.map(item => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold ${active ? "text-[var(--signal)]" : "text-[var(--muted)]"}`}>
            <Icon className="size-5" /><span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
