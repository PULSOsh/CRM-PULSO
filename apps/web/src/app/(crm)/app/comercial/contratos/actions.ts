"use server";

import { auth } from "@/lib/auth";
import { formatRecordCode } from "@/lib/code";
import { finalizeContractIfAllSigned } from "@/lib/contract-helpers";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { nextSequence } from "@pulso/database/counters";
import { generatePublicToken, generateSlug } from "@pulso/database/tokens";
import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateContractClausesFromProposal } from "@/lib/ai";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

type ContractContent = { clauses: string; scopeSummary: string; totalValue: number; paymentSummary: string; type?: "mrr" | "avulso" };

function defaultClauses(content: ContractContent, code: string) {
  return `INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS — ${code}

### CLÁUSULA 1ª — DO OBJETO E ESCOPO TÉCNICO
A CONTRATADA (PULSO TECNOLOGIA E ESTRATÉGIA DIGITAL) prestará ao CONTRATANTE os serviços técnicos e estratégicos descritos a seguir:
${content.scopeSummary || "Serviços digitais conforme proposta comercial aceita."}

### CLÁUSULA 2ª — DOS VALORES E CONDIÇÕES DE PAGAMENTO
Pela prestação dos serviços contratados, o CONTRATANTE pagará a CONTRATADA o valor total de R$ ${content.totalValue.toFixed(2)}.
Condições de pagamento estipuladas: ${content.paymentSummary}

Em caso de inadimplemento de qualquer parcela, incidirá multa moratória de 2% (dois por cento) sobre o valor devido, acrescida de juros de mora de 1% (um por cento) ao mês.

### CLÁUSULA 3ª — DAS OBRIGAÇÕES DAS PARTES
1. A CONTRATADA compromete-se a executar os serviços com rigor técnico e dentro dos padrões de mercado.
2. O CONTRATANTE compromete-se a fornecer tempestivamente todas as informações, acessos e aprovações necessárias ao andamento do projeto.

### CLÁUSULA 4ª — DOS PRAZOS E CRONOGRAMA
O cronograma operacional terá início após a confirmação do pagamento inicial e disponibilização integral dos insumos pelo CONTRATANTE.

### CLÁUSULA 5ª — DA PROPRIEDADE INTELECTUAL
Após a quitação integral deste contrato, todos os direitos patrimoniais sobre os entregáveis desenvolvidos serão transferidos ao CONTRATANTE. A CONTRATADA reserva-se o direito de divulgar o projeto em seu portfólio.

### CLÁUSULA 6ª — DA RESCISÃO
Este contrato poderá ser rescindido por qualquer das partes mediante comunicação por escrito com antecedência mínima de 15 dias, respeitando o pagamento proporcional das etapas executadas.

### CLÁUSULA 7ª — DO FORO DE ELEIÇÃO
As partes elegem o Foro da Comarca de Fortaleza, Estado do Ceará, com renúncia expressa a qualquer outro.`;
}

function buildProposalFullText(versionContent: any, totalValue: number, paymentSummary: string) {
  const scopeStr = (versionContent.scopeItems || [])
    .map((i: any, idx: number) => `${idx + 1}. ${i.label}${i.description ? ` - ${i.description}` : ''} (R$ ${i.price})`)
    .join("\n");

  const addonsStr = (versionContent.addons || [])
    .map((a: any) => `- ${a.label}${a.description ? ` - ${a.description}` : ''} (R$ ${a.price})`)
    .join("\n");

  const paymentStr = (versionContent.paymentConditions || [])
    .map((p: any) => `- ${p.label} (${p.installments}x)`)
    .join("\n");

  return [
    `INTRODUÇÃO: ${versionContent.intro || '—'}`,
    `CONTEXTO DO CLIENTE: ${versionContent.context || '—'}`,
    `ESCOPO COMPLETO DOS SERVIÇOS:\n${scopeStr || 'Nenhum item listado.'}`,
    addonsStr ? `OPCIONAIS/ADDONS:\n${addonsStr}` : '',
    `VALOR TOTAL DA PROPOSTA: R$ ${totalValue.toFixed(2)}`,
    `CONDIÇÕES DE PAGAMENTO:\n${paymentStr || paymentSummary}`,
    versionContent.termsSummary ? `TERMOS E GARANTIAS: ${versionContent.termsSummary}` : ''
  ].filter(Boolean).join("\n\n");
}

export async function createContractFromProposal(proposalId: string): Promise<{ error?: string; contractId?: string }> {
  await requireSession();

  const [proposal] = await db.select().from(schema.proposals).where(eq(schema.proposals.id, proposalId)).limit(1);
  if (!proposal) return { error: "Proposta não encontrada." };
  if (proposal.status !== "accepted" || !proposal.acceptedVersionId) return { error: "Só é possível gerar contrato de uma proposta aceita." };

  const [existing] = await db.select({ id: schema.contracts.id }).from(schema.contracts)
    .where(eq(schema.contracts.proposalVersionId, proposal.acceptedVersionId)).limit(1);
  if (existing) return { contractId: existing.id };

  const [version] = await db.select().from(schema.proposalVersions).where(eq(schema.proposalVersions.id, proposal.acceptedVersionId)).limit(1);
  if (!version) return { error: "Versão aceita não encontrada." };

  const acceptedPayment = version.content.paymentConditions.find((p) => p.id === proposal.acceptanceDetails?.paymentConditionId);
  const content: ContractContent = {
    scopeSummary: version.content.scopeItems.map((i) => i.label).join("; "),
    totalValue: Number(version.total),
    paymentSummary: acceptedPayment ? `${acceptedPayment.label} (${acceptedPayment.installments}x)` : "A definir",
    clauses: "",
    type: "avulso"
  };

  const year = new Date().getFullYear();
  const sequence = await nextSequence("contract", year);
  const code = formatRecordCode("contract", year, sequence);
  
  try {
    const proposalData = buildProposalFullText(version.content, content.totalValue, content.paymentSummary);
    content.clauses = await generateContractClausesFromProposal(proposalData, code);
  } catch (e) {
    console.error("Failed to generate AI clauses on contract creation", e);
    content.clauses = defaultClauses(content, code);
  }

  const [contract] = await db.insert(schema.contracts).values({
    code, proposalVersionId: version.id, opportunityId: proposal.opportunityId, content, status: "draft"
  }).returning();

  if (proposal.acceptorName) {
    await db.insert(schema.contractSignatories).values({
      contractId: contract.id, name: proposal.acceptorName, document: proposal.acceptorDocument, role: "client", position: 1
    });
  }
  await db.insert(schema.contractSignatories).values({ contractId: contract.id, name: "PULSO", role: "pulso", position: 0 });

  await db.insert(schema.contractEvents).values({ contractId: contract.id, type: "created" });
  await recordAuditEvent({ actorType: "user", action: "contract.created", entityType: "contract", entityId: contract.id, after: { code } });

  revalidatePath("/app/comercial/contratos");
  return { contractId: contract.id };
}

const contentSchema = z.object({ 
  clauses: z.string().trim().min(1),
  type: z.enum(["mrr", "avulso"]).optional()
});

export async function updateContractContent(contractId: string, formData: FormData) {
  await requireSession();
  const parsed = contentSchema.safeParse({ clauses: formData.get("clauses"), type: formData.get("type") });
  if (!parsed.success) throw new Error("Dados inválidos.");

  const [contract] = await db.select().from(schema.contracts).where(eq(schema.contracts.id, contractId)).limit(1);
  if (!contract) throw new Error("Contrato não encontrado.");
  if (contract.status !== "draft") throw new Error("Só é possível editar contratos em rascunho.");

  const content = { ...(contract.content as ContractContent), clauses: parsed.data.clauses, type: parsed.data.type || "avulso" };
  await db.update(schema.contracts).set({ content, updatedAt: new Date() }).where(eq(schema.contracts.id, contractId));

  revalidatePath(`/app/comercial/contratos/${contractId}`);
}

const signatorySchema = z.object({ name: z.string().trim().min(2), email: z.string().trim().email().optional().or(z.literal("")), document: z.string().trim().optional().or(z.literal("")) });

export async function addSignatory(contractId: string, formData: FormData) {
  await requireSession();
  const parsed = signatorySchema.safeParse({ name: formData.get("name"), email: formData.get("email"), document: formData.get("document") });
  if (!parsed.success) throw new Error("Informe ao menos o nome do signatário.");

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.contractSignatories).where(eq(schema.contractSignatories.contractId, contractId));
  await db.insert(schema.contractSignatories).values({
    contractId, name: parsed.data.name, email: parsed.data.email || null, document: parsed.data.document || null,
    role: "client", position: count + 1
  });

  revalidatePath(`/app/comercial/contratos/${contractId}`);
}

export async function removeSignatory(contractId: string, signatoryId: string) {
  await requireSession();
  await db.delete(schema.contractSignatories).where(and(eq(schema.contractSignatories.id, signatoryId), eq(schema.contractSignatories.contractId, contractId)));
  revalidatePath(`/app/comercial/contratos/${contractId}`);
}

export async function reviewAndSend(contractId: string) {
  await requireSession();

  const [contract] = await db.select().from(schema.contracts).where(eq(schema.contracts.id, contractId)).limit(1);
  if (!contract) throw new Error("Contrato não encontrado.");
  if (contract.status !== "draft") throw new Error("Este contrato já foi enviado.");

  const signatories = await db.select().from(schema.contractSignatories).where(eq(schema.contractSignatories.contractId, contractId));
  if (signatories.length === 0) throw new Error("Adicione ao menos um signatário antes de enviar.");

  const { token, tokenHash } = generatePublicToken();
  const slug = generateSlug(contract.code);

  await db.update(schema.contracts).set({ status: "sent", sentAt: new Date(), publicSlug: slug, publicTokenHash: tokenHash, updatedAt: new Date() }).where(eq(schema.contracts.id, contractId));
  await db.insert(schema.contractEvents).values({ contractId, type: "sent" });
  await recordAuditEvent({ actorType: "user", action: "contract.sent", entityType: "contract", entityId: contractId });

  revalidatePath("/app/comercial/contratos");
  // Redireciona com o token na URL (só aparece essa vez -- só o hash fica salvo) em vez de
  // depender de estado local de Client Component, que some quando a Server Action muda o
  // `status` e a revalidação automática desmonta o branch condicional que o continha.
  redirect(`/app/comercial/contratos/${contractId}?link_token=${token}`);
}

const internalSignSchema = z.object({ name: z.string().trim().min(2), document: z.string().trim().optional().or(z.literal("")), declaration: z.literal("on", { message: "Confirme a declaração." }) });

export async function signInternally(contractId: string, signatoryId: string, formData: FormData) {
  const session = await requireSession();

  const parsed = internalSignSchema.safeParse({ name: formData.get("name"), document: formData.get("document"), declaration: formData.get("declaration") });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Revise os campos.");

  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip");
  const userAgent = h.get("user-agent");

  await db.update(schema.contractSignatories).set({
    status: "signed", signedAt: new Date(), name: parsed.data.name, document: parsed.data.document || null,
    ipAddress: ip, userAgent, declaration: "Declaro que li e assino este contrato em nome da PULSO.", updatedAt: new Date()
  }).where(and(eq(schema.contractSignatories.id, signatoryId), eq(schema.contractSignatories.contractId, contractId)));

  await db.insert(schema.contractEvents).values({ contractId, type: "signed_internal", payload: { signatoryId, actorId: session.user.id } });
  await recordAuditEvent({ actorType: "user", action: "contract.signed_internal", entityType: "contract", entityId: contractId, ipAddress: ip, userAgent });

  await finalizeContractIfAllSigned(contractId);
  revalidatePath(`/app/comercial/contratos/${contractId}`);
}

export async function linkSignedDocument(contractId: string, fileId: string) {
  await requireSession();
  await db.update(schema.contracts).set({
    signedFileId: fileId, status: "signed", signedAt: new Date(), provider: "upload", updatedAt: new Date()
  }).where(eq(schema.contracts.id, contractId));

  await db.insert(schema.contractEvents).values({ contractId, type: "signed_document_uploaded", payload: { fileId } });
  await recordAuditEvent({ actorType: "user", action: "contract.signed_document_uploaded", entityType: "contract", entityId: contractId, after: { fileId } });

  revalidatePath(`/app/comercial/contratos/${contractId}`);
}

export async function cancelContract(contractId: string, formData: FormData) {
  await requireSession();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("Motivo do cancelamento é obrigatório.");

  await db.update(schema.contracts).set({ status: "cancelled", cancelledAt: new Date(), cancelReason: reason, updatedAt: new Date() }).where(eq(schema.contracts.id, contractId));
  await db.insert(schema.contractEvents).values({ contractId, type: "cancelled", payload: { reason } });
  await recordAuditEvent({ actorType: "user", action: "contract.cancelled", entityType: "contract", entityId: contractId, after: { reason } });

  revalidatePath(`/app/comercial/contratos/${contractId}`);
  revalidatePath("/app/comercial/contratos");
}

export async function generateAIClausesForContract(contractId: string) {
  await requireSession();
  
  const [contract] = await db.select().from(schema.contracts).where(eq(schema.contracts.id, contractId)).limit(1);
  if (!contract) return { error: "Contrato não encontrado." };
  if (contract.status !== "draft") return { error: "Apenas contratos em rascunho podem ser alterados pela IA." };

  const [version] = await db.select().from(schema.proposalVersions).where(eq(schema.proposalVersions.id, contract.proposalVersionId)).limit(1);
  if (!version) return { error: "Versão da proposta não encontrada." };

  const contractContent = contract.content as ContractContent;
  const proposalData = buildProposalFullText(version.content, Number(contractContent?.totalValue || 0), contractContent?.paymentSummary || "");

  try {
    const clauses = await generateContractClausesFromProposal(proposalData, contract.code);
    await db.update(schema.contracts).set({
      content: { ...contract.content, clauses },
      updatedAt: new Date()
    }).where(eq(schema.contracts.id, contractId));

    revalidatePath(`/app/comercial/contratos/${contractId}`);
    return { success: true };
  } catch (error) {
    console.error("AI error contract", error);
    return { error: "Erro ao gerar cláusulas com IA." };
  }
}

export async function regenerateContractLink(contractId: string): Promise<{ link: string }> {
  await requireSession();
  const { token, tokenHash } = generatePublicToken();
  await db.update(schema.contracts).set({ publicTokenHash: tokenHash, updatedAt: new Date() }).where(eq(schema.contracts.id, contractId));
  await recordAuditEvent({ actorType: "user", action: "contract.link_regenerated", entityType: "contract", entityId: contractId });

  const [contract] = await db.select({ publicSlug: schema.contracts.publicSlug }).from(schema.contracts).where(eq(schema.contracts.id, contractId)).limit(1);
  revalidatePath(`/app/comercial/contratos/${contractId}`);
  return { link: `/contrato/${contract.publicSlug}?token=${token}` };
}

export async function listContracts() {
  await requireSession();
  return db.select({ contract: schema.contracts, opportunityTitle: schema.opportunities.title })
    .from(schema.contracts)
    .innerJoin(schema.opportunities, eq(schema.opportunities.id, schema.contracts.opportunityId))
    .orderBy(desc(schema.contracts.createdAt));
}

export async function listAcceptedProposalsWithoutContract() {
  await requireSession();
  const proposals = await db.select({ proposal: schema.proposals, opportunityTitle: schema.opportunities.title })
    .from(schema.proposals)
    .innerJoin(schema.opportunities, eq(schema.opportunities.id, schema.proposals.opportunityId))
    .where(eq(schema.proposals.status, "accepted"));

  const withContracts = await db.select({ proposalVersionId: schema.contracts.proposalVersionId }).from(schema.contracts);
  const contractedVersionIds = new Set(withContracts.map((c) => c.proposalVersionId));

  return proposals.filter(({ proposal }) => !proposal.acceptedVersionId || !contractedVersionIds.has(proposal.acceptedVersionId))
    .map(({ proposal, opportunityTitle }) => ({ id: proposal.id, code: proposal.code, opportunityTitle }));
}
