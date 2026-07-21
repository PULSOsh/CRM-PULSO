import { PulsoLogo } from "@/components/logo";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-grid min-h-screen">
      <header className="border-b border-[var(--line)] bg-[color:var(--paper)/.9] px-5 py-4 ">
        <div className="mx-auto flex max-w-6xl items-center justify-between"><PulsoLogo /><span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Ambiente seguro</span></div>
      </header>
      {children}
    </div>
  );
}
