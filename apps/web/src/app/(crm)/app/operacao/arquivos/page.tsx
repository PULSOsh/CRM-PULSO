import Link from "next/link";
import { Badge, Card } from "@pulso/ui";
import { db, schema } from "@pulso/database";
import { inArray } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { listFiles } from "../projetos/actions";
import { GenericUploadForm } from "./upload-form";
import { FileRowActions } from "./file-actions";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function FilesPage({ searchParams }: { searchParams: Promise<{ trashed?: string }> }) {
  const { trashed } = await searchParams;
  const showTrashed = trashed === "1";
  const files = await listFiles({ includeTrashed: showTrashed });

  const projectIds = [...new Set(files.filter((f) => f.entityType === "project" && f.entityId).map((f) => f.entityId!))];
  const projects = projectIds.length
    ? await db.select({ id: schema.projects.id, name: schema.projects.name }).from(schema.projects).where(inArray(schema.projects.id, projectIds))
    : [];
  const projectNames = new Map(projects.map((p) => [p.id, p.name]));

  const visibleFiles = showTrashed ? files.filter((f) => f.trashedAt) : files;

  return (
    <>
      <PageHeader eyebrow="Operação" title="Arquivos" description="Biblioteca privada por cliente e projeto, com integridade e lixeira."
        actions={<GenericUploadForm />} />

      <div className="mb-4 flex gap-2">
        <Link href="/app/operacao/arquivos" className={`filter-chip ${!showTrashed ? "filter-chip-active" : ""}`}>Ativos</Link>
        <Link href="/app/operacao/arquivos?trashed=1" className={`filter-chip ${showTrashed ? "filter-chip-active" : ""}`}>Lixeira</Link>
      </div>

      <Card className="overflow-hidden">
        {visibleFiles.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">{showTrashed ? "Lixeira vazia." : "Nenhum arquivo ainda."}</p>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {visibleFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between gap-4 p-4">
                <a href={`/api/files/${file.id}`} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold hover:underline">{file.originalName}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{formatSize(file.sizeBytes)} · {file.mimeType}</p>
                </a>
                {file.entityType === "project" && file.entityId && <Badge tone="neutral">{projectNames.get(file.entityId) ?? "Projeto"}</Badge>}
                <FileRowActions fileId={file.id} trashed={Boolean(file.trashedAt)} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
