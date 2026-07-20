import "server-only";
import { formatRecordCode } from "@/lib/code";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { nextSequence } from "@pulso/database/counters";
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";

type ContractContent = { clauses: string; scopeSummary: string; totalValue: number; paymentSummary: string };

/** Quando todos os signatários assinam, congela o contrato e prepara o recebível (sem cobrança automática). */
export async function finalizeContractIfAllSigned(contractId: string) {
  const signatories = await db.select().from(schema.contractSignatories).where(eq(schema.contractSignatories.contractId, contractId));
  if (signatories.length === 0 || signatories.some((s) => s.status !== "signed")) return;

  const [contract] = await db.select().from(schema.contracts).where(eq(schema.contracts.id, contractId)).limit(1);
  if (!contract || contract.status === "signed") return;

  const hash = createHash("sha256").update(JSON.stringify({ content: contract.content, signatories })).digest("hex");
  await db.update(schema.contracts).set({ status: "signed", signedAt: new Date(), documentHash: hash, updatedAt: new Date() }).where(eq(schema.contracts.id, contractId));
  await db.insert(schema.contractEvents).values({ contractId, type: "fully_signed" });

  const year = new Date().getFullYear();
  const sequence = await nextSequence("charge", year);
  const code = formatRecordCode("charge", year, sequence);
  const content = contract.content as ContractContent;
  await db.insert(schema.financialEntries).values({
    code, scope: "company", direction: "in", type: "receivable",
    description: `Recebível do contrato ${contract.code}`,
    amountExpected: String(content.totalValue),
    competenceDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    status: "pending",
    provider: "manual",
    metadata: { contractId, contractCode: contract.code }
  });

  await recordAuditEvent({ actorType: "system", action: "contract.fully_signed", entityType: "contract", entityId: contractId, after: { documentHash: hash } });
}
