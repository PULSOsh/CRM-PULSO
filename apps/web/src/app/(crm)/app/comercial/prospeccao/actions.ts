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
    
    // Find the best sheet that contains actual lead rows
    let targetSheetName = workbook.SheetNames[0];
    for (const name of workbook.SheetNames) {
      if (/lead|contato|prosp|odonto/i.test(name)) {
        targetSheetName = name;
        break;
      }
    }

    let worksheet = workbook.Sheets[targetSheetName];
    let rawData = xlsx.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
    
    let headerRowIdx = -1;
    
    // Helper to find header in a sheet's rawData
    const findHeaderRow = (rows: string[][]) => {
      for (let i = 0; i < Math.min(rows.length, 25); i++) {
        const row = rows[i];
        if (!row) continue;
        const joined = row.map(cell => String(cell || "").toLowerCase()).join(" ");
        if (joined.includes("lead") || joined.includes("nome") || joined.includes("contato") || joined.includes("empresa")) {
          return i;
        }
      }
      return -1;
    };

    headerRowIdx = findHeaderRow(rawData);

    // If first sheet didn't contain headers (e.g. Dashboard), search all other sheets
    if (headerRowIdx === -1) {
      for (const name of workbook.SheetNames) {
        const sheetCandidate = workbook.Sheets[name];
        const candidateData = xlsx.utils.sheet_to_json<string[]>(sheetCandidate, { header: 1 });
        const idx = findHeaderRow(candidateData);
        if (idx !== -1) {
          targetSheetName = name;
          worksheet = sheetCandidate;
          rawData = candidateData;
          headerRowIdx = idx;
          break;
        }
      }
    }

    if (headerRowIdx === -1) {
      return { error: "Não foi possível encontrar a linha de cabeçalho com leads na planilha." };
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
      let website = "";
      let segment = "";
      let companyName = "";
      let metadata: Record<string, unknown> = {};
      let notesParts = [];

      for (let j = 0; j < headers.length; j++) {
        const h = headers[j];
        const rawHeader = String(rawData[headerRowIdx][j] || "").trim();
        const val = row[j] !== undefined && row[j] !== null ? String(row[j]).trim() : "";
        if (!val) continue;

        if (h === "lead" || h === "nome" || h.includes("nome do contato") || h.includes("profissional")) {
          name = val;
        } else if (h.includes("empresa") || h.includes("clínica") || h.includes("clinica")) {
          companyName = val;
        } else if (h.includes("telefone") || h.includes("whatsapp") || h.includes("celular")) {
          phone = val;
        } else if (h.includes("email") || h.includes("e-mail")) {
          email = val;
        } else if (h.includes("instagram") && !h.includes("abrir") && !h.includes("pesquisar")) {
          instagram = val;
        } else if (h.includes("website") || h.includes("site") || h.includes("link bio")) {
          website = val;
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
        } else if (h.includes("mensagem personalizada")) {
          metadata.mensagemPersonalizada = val;
        } else if (h.includes("especialidade") || h.includes("posicionamento") || h.includes("tipo")) {
          metadata[rawHeader] = val;
          if (!segment) segment = val;
        } else {
          metadata[rawHeader] = val;
          notesParts.push(`${rawHeader}: ${val}`);
        }
      }

      // If name is missing, fallback to companyName
      if (!name && companyName) {
        name = companyName;
      }

      if (name) {
        itemsToInsert.push({
          listId,
          name,
          companyName: companyName || null,
          phone: phone || null,
          email: email || null,
          instagram: instagram || null,
          website: website || null,
          segment: segment || null,
          notes: notesParts.length > 0 ? notesParts.join("\n") : null,
          metadata,
          status: "not_researched" as const,
        });
      }
    }

    if (itemsToInsert.length === 0) {
      return { error: "Nenhum lead válido encontrado nas linhas da planilha." };
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
