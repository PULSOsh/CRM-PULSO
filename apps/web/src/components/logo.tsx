export function PulsoLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid size-9 place-items-center rounded-xl bg-[var(--carbon)] text-sm font-black text-white">
        P<span className="text-[var(--signal)]">.</span>
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="text-[17px] font-extrabold tracking-[-0.05em]">
            PULSO<span className="text-[var(--signal)]">.</span>
          </div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--muted)]">
            CRM operacional
          </div>
        </div>
      )}
    </div>
  );
}
