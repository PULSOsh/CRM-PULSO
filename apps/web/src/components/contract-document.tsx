import React from "react";
import { Badge, Card } from "@pulso/ui";
import { ShieldCheck, FileText, CheckCircle2, Lock, Scale } from "lucide-react";

interface Signatory {
  id: string;
  name: string;
  role: string;
  status: string;
  signedAt?: Date | string | null;
  ipAddress?: string | null;
}

interface ContractDocumentProps {
  code: string;
  clauses: string;
  totalValue?: number;
  paymentSummary?: string;
  status: string;
  signatories?: Signatory[];
  documentHash?: string | null;
  signedAt?: Date | string | null;
}

export function ContractDocument({
  code,
  clauses,
  totalValue,
  paymentSummary,
  status,
  signatories = [],
  documentHash,
  signedAt,
}: ContractDocumentProps) {
  // Parse clauses into structured sections based on ### Cláusula headers or double newlines
  const renderFormattedClauses = (text: string) => {
    const rawParagraphs = text.split(/\n(?=###|\n)/);

    return rawParagraphs.map((block, idx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // Header match: ### CLÁUSULA ...
      if (trimmed.startsWith("###")) {
        const lines = trimmed.split("\n");
        const title = lines[0].replace(/^###\s*/, "");
        const body = lines.slice(1).join("\n").trim();

        return (
          <div key={idx} className="mb-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3 border-b border-[var(--line)] pb-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--signal)]/10 text-[var(--signal)] font-black text-xs">
                §
              </span>
              <h3 className="font-extrabold text-base text-[var(--text)] tracking-tight">{title}</h3>
            </div>
            {body && (
              <div className="prose prose-invert max-w-none text-xs leading-relaxed text-[var(--text)] opacity-90 space-y-2 whitespace-pre-wrap font-sans">
                {body}
              </div>
            )}
          </div>
        );
      }

      // Regular text block
      return (
        <div key={idx} className="mb-4 text-xs leading-relaxed text-[var(--text)] opacity-90 whitespace-pre-wrap font-sans">
          {trimmed}
        </div>
      );
    });
  };

  const isSigned = status === "signed";

  return (
    <div className="mx-auto max-w-4xl space-y-6 text-[var(--text)] font-sans">
      {/* Header do Documento */}
      <div className="rounded-3xl border border-[var(--line)] bg-gradient-to-br from-[var(--surface)] via-[var(--soft)] to-[var(--surface)] p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-[var(--signal)]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--line)] pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-[var(--signal)] text-white shadow-lg shadow-[var(--signal)]/20">
              <Scale className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight">PULSO</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--signal)] bg-[var(--signal)]/10 px-2 py-0.5 rounded-full font-bold">
                  Contrato Oficial
                </span>
              </div>
              <p className="text-xs text-[var(--muted)]">Tecnologia, Design & Estratégia Digital</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block font-mono text-xs font-extrabold text-[var(--muted)]">{code}</span>
              <Badge tone={isSigned ? "success" : status === "cancelled" ? "danger" : "signal"}>
                {isSigned ? "Contrato Assinado" : status === "cancelled" ? "Cancelado" : "Aguardando Assinatura"}
              </Badge>
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text)]">
            Instrumento Particular de Prestação de Serviços
          </h1>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Documento digital com validade jurídica conforme Medida Provisória nº 2.200-2/2001.
          </p>
        </div>

        {/* Resumo Financeiro / Condições */}
        {(totalValue !== undefined || paymentSummary) && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--line)]">
            {totalValue !== undefined && (
              <div className="rounded-2xl bg-[var(--soft)]/80 p-4 border border-[var(--line)]">
                <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">
                  Valor Total do Contrato
                </span>
                <span className="text-2xl font-black text-[var(--signal)]">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalValue)}
                </span>
              </div>
            )}

            {paymentSummary && (
              <div className="rounded-2xl bg-[var(--soft)]/80 p-4 border border-[var(--line)]">
                <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">
                  Condições de Pagamento
                </span>
                <span className="text-sm font-bold text-[var(--text)]">{paymentSummary}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cláusulas Contratuais Formatadas */}
      <div className="space-y-4">
        {renderFormattedClauses(clauses)}
      </div>

      {/* Seção de Signatários & Selo de Autenticidade */}
      <Card className="p-6 border border-[var(--line)] bg-[var(--surface)] shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="size-5 text-[var(--signal)]" />
          <h3 className="font-extrabold text-base text-[var(--text)]">Signatários & Validade Digital</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signatories.map((s) => (
            <div
              key={s.id}
              className={`rounded-2xl border p-4 transition-all ${
                s.status === "signed"
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-[var(--line)] bg-[var(--soft)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-sm text-[var(--text)]">{s.name}</p>
                  <p className="text-xs text-[var(--muted)]">{s.role === "pulso" ? "CONTRATADA (PULSO)" : "CONTRATANTE"}</p>
                </div>
                {s.status === "signed" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="size-3.5" /> Assinado
                  </span>
                ) : (
                  <span className="text-xs font-bold text-[var(--muted)] bg-[var(--line)]/50 px-2.5 py-1 rounded-lg">
                    Pendente
                  </span>
                )}
              </div>

              {s.signedAt && (
                <div className="mt-3 pt-2 border-t border-[var(--line)] text-[10px] text-[var(--muted)] flex items-center justify-between">
                  <span>Assinado em: {new Date(s.signedAt).toLocaleString("pt-BR")}</span>
                  {s.ipAddress && <span>IP: {s.ipAddress}</span>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selo de Criptografia se Assinado */}
        {isSigned && documentHash && (
          <div className="mt-6 pt-4 border-t border-[var(--line)] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-[var(--muted)]">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-emerald-400 shrink-0" />
              <span>Assinatura Digital Auditada via Hash Criptográfico SHA-256</span>
            </div>
            <code className="font-mono text-[10px] bg-[var(--soft)] px-3 py-1 rounded-lg border border-[var(--line)] text-[var(--text)] truncate max-w-xs">
              {documentHash}
            </code>
          </div>
        )}
      </Card>
    </div>
  );
}
