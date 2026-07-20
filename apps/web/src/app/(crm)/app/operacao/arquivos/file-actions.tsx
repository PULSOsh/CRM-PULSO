"use client";

import { useTransition } from "react";
import { restoreFile, trashFile } from "../projetos/actions";

export function FileRowActions({ fileId, trashed }: { fileId: string; trashed: boolean }) {
  const [pending, startTransition] = useTransition();

  return trashed ? (
    <button type="button" disabled={pending} onClick={() => startTransition(() => restoreFile(fileId))} className="text-xs font-bold text-[var(--muted)] hover:text-[var(--signal)]">Restaurar</button>
  ) : (
    <button type="button" disabled={pending} onClick={() => startTransition(() => trashFile(fileId))} className="text-xs font-bold text-[var(--muted)] hover:text-[var(--error)]">Excluir</button>
  );
}
