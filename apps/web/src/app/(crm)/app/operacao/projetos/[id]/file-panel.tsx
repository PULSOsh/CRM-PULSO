"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { trashFile, restoreFile } from "../actions";

type FileRow = { id: string; originalName: string; sizeBytes: number; mimeType: string; trashedAt: Date | string | null };

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePanel({ projectId, files }: { projectId: string; files: FileRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("entityType", "project");
    formData.set("entityId", projectId);
    formData.set("visibility", "internal");

    fetch("/api/files", { method: "POST", body: formData }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Não foi possível enviar o arquivo."); return; }
      router.refresh();
    }).finally(() => setUploading(false));
  }

  return (
    <div className="space-y-3">
      {files.length === 0 && <p className="text-sm text-[var(--muted)]">Nenhum arquivo ainda.</p>}
      {files.map((file) => (
        <div key={file.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] p-3">
          <a href={`/api/files/${file.id}`} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold hover:underline">{file.originalName}</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">{formatSize(file.sizeBytes)}</p>
          </a>
          {file.trashedAt ? (
            <button type="button" disabled={pending} onClick={() => startTransition(() => restoreFile(file.id, projectId))} className="text-xs font-bold text-[var(--muted)] hover:text-[var(--signal)]">Restaurar</button>
          ) : (
            <button type="button" disabled={pending} onClick={() => startTransition(() => trashFile(file.id, projectId))} className="text-xs font-bold text-[var(--muted)] hover:text-[var(--error)]">Excluir</button>
          )}
        </div>
      ))}

      <label className="secondary-button mt-2 inline-flex w-full cursor-pointer justify-center">
        {uploading ? "Enviando..." : "Enviar arquivo"}
        <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
      </label>
      {error && <p role="alert" className="text-xs font-semibold text-[var(--error)]">{error}</p>}
    </div>
  );
}
