import { createHash } from "node:crypto";

export type DocumentSnapshot = {
  type: "proposal" | "contract" | "receipt" | "report" | "approval";
  code: string;
  version: number;
  generatedAt: string;
  content: Record<string, unknown>;
};

export function createDocumentHash(snapshot: DocumentSnapshot) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

export interface PdfRenderer {
  render(snapshot: DocumentSnapshot): Promise<Uint8Array>;
}

/** Adaptador de desenvolvimento. Produção deve imprimir HTML versionado via Chromium. */
export class HtmlToPdfPlaceholder implements PdfRenderer {
  async render(snapshot: DocumentSnapshot) {
    const content = [
      "PULSO — DOCUMENTO DE DESENVOLVIMENTO",
      `Tipo: ${snapshot.type}`,
      `Código: ${snapshot.code}`,
      `Versão: ${snapshot.version}`,
      `Gerado em: ${snapshot.generatedAt}`,
      `Hash: ${createDocumentHash(snapshot)}`,
      "",
      JSON.stringify(snapshot.content, null, 2),
    ].join("\n");
    return new TextEncoder().encode(content);
  }
}
