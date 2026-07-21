"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { navigation } from "@/lib/nav";
import { PulsoLogo } from "./logo";

export function MobileMenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  // Close when pressing Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-[var(--paper)] lg:hidden transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className="fixed inset-y-0 left-0 z-50 w-[274px] flex flex-col bg-[var(--surface)] border-r border-[var(--line)] shadow-xl lg:hidden transform transition-transform"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--line)] px-4 shrink-0">
          <PulsoLogo compact />
          <button 
            className="grid size-9 place-items-center rounded-xl border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--soft)]" 
            onClick={onClose} 
            aria-label="Fechar menu"
          >
            <X className="size-4" />
          </button>
        </div>
        <nav className="scrollbar-thin flex-1 overflow-y-auto p-4">
          {navigation.map(group => (
            <div key={group.title} className="mb-6">
              <p className="px-3 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{group.title}</p>
              <div className="space-y-1">
                {group.items.map(item => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-bold transition-colors ${
                        active 
                          ? "bg-[var(--signal)]/10 text-[var(--signal)]" 
                          : "text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--carbon)]"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
