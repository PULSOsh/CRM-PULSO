export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--paper)]">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-pulse rounded-full bg-[var(--signal)]/30 border border-[var(--signal)]" />
        <p className="text-sm font-medium text-[var(--muted-strong)] animate-pulse">Carregando...</p>
      </div>
    </div>
  );
}
