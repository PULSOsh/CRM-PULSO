"use server";

import { auth } from "@/lib/auth";
import { formatRecordCode } from "@/lib/code";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { nextSequence } from "@pulso/database/counters";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as xlsx from "xlsx";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

export async function listProspectingLists() {
  await requireSession();
  const rows = await db.select({
    list: schema.prospectingLists,
    itemCount: db.$count(schema.prospectingItems, eq(schema.prospectingItems.listId, schema.prospectingLists.id))
  })
    .from(schema.prospectingLists)
    .where(eq(schema.prospectingLists.status, "active"))
    .orderBy(desc(schema.prospectingLists.createdAt));
  return rows;
}

export async function getProspectingList(id: string) {
  await requireSession();
  const [list] = await db.select().from(schema.prospectingLists).where(eq(schema.prospectingLists.id, id)).limit(1);
  return list || null;
}

export async function listItemsForProspectingList(listId: string) {
  await requireSession();
  return db.select().from(schema.prospectingItems)
    .where(eq(schema.prospectingItems.listId, listId))
    .orderBy(desc(schema.prospectingItems.createdAt));
}

const createSchema = z.object({
  name: z.string().trim().min(1, "O nome da lista é obrigatório."),
  description: z.string().trim().optional(),
});

export async function createProspectingList(_prev: any, formData: FormData) {
  await requireSession();
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Erro desconhecido." };

  const year = new Date().getFullYear();
  const sequence = await nextSequence("prospecting_list", year);
  const code = formatRecordCode("prospectingList", year, sequence);

  const [list] = await db.insert(schema.prospectingLists).values({
    code,
    name: parsed.data.name,
    description: parsed.data.description,
  }).returning();

  await recordAuditEvent({ actorType: "user", action: "prospecting_list.created", entityType: "prospecting_list", entityId: list.id, after: { name: list.name } });
  revalidatePath("/app/comercial/prospeccao");
  redirect(`/app/comercial/prospeccao/${list.id}`);
}

export async function importProspectingItems(_prev: any, formData: FormData) {
  await requireSession();
  const listId = formData.get("listId") as string;
  const file = formData.get("file") as File;
  
  if (!listId || !file) return { error: "Lista ou arquivo ausente." };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = xlsx.read(arrayBuffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const rawData = xlsx.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
    
    let headerRowIdx = -1;
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row) continue;
      const joined = row.join(" ").toLowerCase();
      if (joined.includes("nome") || joined.includes("lead") || joined.includes("contato")) {
        headerRowIdx = i;
        break;
      }
    }
    
    if (headerRowIdx === -1) {
      return { error: "Não foi possível encontrar a linha de cabeçalho na planilha." };
    }

    const headers = rawData[headerRowIdx].map(h => String(h || "").trim().toLowerCase());
    
    const itemsToInsert = [];
    for (let i = headerRowIdx + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0 || !row.some(Boolean)) continue;
      
      let name = "";
      let phone = "";
      let email = "";
      let instagram = "";
      let segment = "";
      let metadata: Record<string, unknown> = {};
      let notesParts = [];

      for (let j = 0; j < headers.length; j++) {
        const h = headers[j];
        const rawHeader = String(rawData[headerRowIdx][j] || "").trim();
        const val = row[j] ? String(row[j]).trim() : "";
        if (!val) continue;

        if (h.includes("nome") || h === "lead" || h.includes("contato")) {
          name = val;
        } else if (h.includes("telefone") || h.includes("whatsapp")) {
          phone = val;
        } else if (h.includes("email") || h.includes("e-mail")) {
          email = val;
        } else if (h.includes("insta")) {
          instagram = val;
        } else if (h.includes("cidade")) {
          metadata.cidade = val;
          segment = segment ? `${segment} - ${val}` : val;
        } else if (h.includes("prioridade")) {
          metadata.prioridade = val;
        } else if (h.includes("score")) {
          metadata.score = val;
        } else if (h.includes("fit")) {
          metadata.fit = val;
        } else if (h.includes("situacao") || h.includes("situação")) {
          metadata.situacaoDigital = val;
        } else if (h.includes("proxima") || h.includes("próxima")) {
          metadata.proximaAcao = val;
        } else if (h.includes("meta")) {
          metadata.meta30Dias = val;
        } else if (h.includes("segmento") || h.includes("nicho")) {
          segment = val;
        } else {
          metadata[rawHeader] = val;
          notesParts.push(`${rawHeader}: ${val}`);
        }
      }

      if (name) {
        itemsToInsert.push({
          listId,
          name,
          phone: phone || null,
          email: email || null,
          instagram: instagram || null,
          segment: segment || null,
          notes: notesParts.length > 0 ? notesParts.join("\n") : null,
          metadata,
          status: "not_researched" as const,
        });
      }
    }

    if (itemsToInsert.length === 0) {
      return { error: "Nenhum item válido encontrado na planilha." };
    }

    for (let i = 0; i < itemsToInsert.length; i += 100) {
      await db.insert(schema.prospectingItems).values(itemsToInsert.slice(i, i + 100));
    }

    await recordAuditEvent({ actorType: "user", action: "prospecting_items.imported", entityType: "prospecting_list", entityId: listId, after: { count: itemsToInsert.length } });
    revalidatePath(`/app/comercial/prospeccao/${listId}`);
    return { success: true, count: itemsToInsert.length };

  } catch (error) {
    console.error("Import error", error);
    return { error: "Falha ao processar arquivo." };
  }
}

export async function convertProspectToLead(itemId: string) {
  await requireSession();
  const [item] = await db.select().from(schema.prospectingItems).where(eq(schema.prospectingItems.id, itemId)).limit(1);
  if (!item) return { error: "Item não encontrado." };

  const year = new Date().getFullYear();

  const contactSeq = await nextSequence("contact", year);
  const contactCode = formatRecordCode("contact", year, contactSeq);

  const [contact] = await db.insert(schema.contacts).values({
    code: contactCode,
    name: item.name,
    email: item.email || null,
    phone: item.phone || null,
    instagram: item.instagram || null,
    notes: item.notes || null,
    status: "active",
  }).returning();

  const leadSeq = await nextSequence("lead", year);
  const leadCode = formatRecordCode("lead", year, leadSeq);

  const [lead] = await db.insert(schema.leads).values({
    code: leadCode,
    name: item.name,
    contactId: contact.id,
    phone: item.phone || null,
    email: item.email || null,
    source: "Prospecção Ativa",
    status: "new",
    message: item.notes || null,
  }).returning();

  await db.update(schema.prospectingItems).set({
    status: "converted",
    contactId: contact.id,
    leadId: lead.id,
    updatedAt: new Date(),
  }).where(eq(schema.prospectingItems.id, itemId));

  revalidatePath(`/app/comercial/prospeccao/${item.listId}`);
  revalidatePath("/app/comercial/leads");
  return { success: true, leadId: lead.id };
}

export async function convertProspectToOpportunity(itemId: string) {
  await requireSession();
  const [item] = await db.select().from(schema.prospectingItems).where(eq(schema.prospectingItems.id, itemId)).limit(1);
  if (!item) return { error: "Item não encontrado." };

  const [defaultPipeline] = await db.select().from(schema.pipelines).where(eq(schema.pipelines.isDefault, true)).limit(1);
  const pipelineId = defaultPipeline?.id ?? (await db.select().from(schema.pipelines).limit(1))[0]?.id;
  
  if (!pipelineId) return { error: "Nenhum funil de vendas cadastrado." };

  const [firstStage] = await db.select().from(schema.pipelineStages)
    .where(eq(schema.pipelineStages.pipelineId, pipelineId))
    .orderBy(schema.pipelineStages.position)
    .limit(1);

  if (!firstStage) return { error: "Nenhuma etapa no funil de vendas." };

  const year = new Date().getFullYear();

  const contactSeq = await nextSequence("contact", year);
  const contactCode = formatRecordCode("contact", year, contactSeq);

  const [contact] = await db.insert(schema.contacts).values({
    code: contactCode,
    name: item.name,
    email: item.email || null,
    phone: item.phone || null,
    instagram: item.instagram || null,
    notes: item.notes || null,
    status: "active",
  }).returning();

  const oppSeq = await nextSequence("opportunity", year);
  const oppCode = formatRecordCode("opportunity", year, oppSeq);

  const [opp] = await db.insert(schema.opportunities).values({
    code: oppCode,
    title: `Oportunidade - ${item.name}`,
    contactId: contact.id,
    pipelineId,
    stageId: firstStage.id,
    status: "open",
    source: "Prospecção Ativa",
  }).returning();

  await db.update(schema.prospectingItems).set({
    status: "converted",
    contactId: contact.id,
    updatedAt: new Date(),
  }).where(eq(schema.prospectingItems.id, itemId));

  revalidatePath(`/app/comercial/prospeccao/${item.listId}`);
  revalidatePath("/app/comercial/oportunidades");
  return { success: true, opportunityId: opp.id };
}

export async function updateProspectItemStatus(itemId: string, newStatus: any) {
  await requireSession();
  const [item] = await db.select().from(schema.prospectingItems).where(eq(schema.prospectingItems.id, itemId)).limit(1);
  if (!item) return { error: "Item não encontrado." };

  await db.update(schema.prospectingItems).set({
    status: newStatus,
    updatedAt: new Date(),
  }).where(eq(schema.prospectingItems.id, itemId));

  revalidatePath(`/app/comercial/prospeccao/${item.listId}`);
  return { success: true };
}
