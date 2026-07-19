"use server";

import { auth } from "@/lib/auth";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { and, asc, eq, ilike, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

const productSchema = z.object({
  code: z.string().trim().min(2, "Informe um código.").max(32),
  name: z.string().trim().min(2, "Informe o nome.").max(160),
  category: z.string().trim().min(1, "Informe a categoria.").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  basePrice: z.string().trim().min(1, "Informe o preço."),
  billingType: z.enum(["one_time", "recurring"]),
  estimatedHours: z.string().trim().optional().or(z.literal("")),
  minimumMargin: z.string().trim().optional().or(z.literal("")),
  allowBriefingSkip: z.string().nullish()
});

export type ProductActionState = { error?: string };

function parseMoney(value: string) {
  return value.replace(/\./g, "").replace(",", ".");
}

export async function createProduct(_prev: ProductActionState, formData: FormData): Promise<ProductActionState> {
  await requireSession();

  const parsed = productSchema.safeParse({
    code: formData.get("code"), name: formData.get("name"), category: formData.get("category"),
    description: formData.get("description"), basePrice: formData.get("basePrice"),
    billingType: formData.get("billingType"), estimatedHours: formData.get("estimatedHours"),
    minimumMargin: formData.get("minimumMargin"), allowBriefingSkip: formData.get("allowBriefingSkip")
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os campos informados." };

  const [existing] = await db.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.code, parsed.data.code)).limit(1);
  if (existing) return { error: `Já existe um produto com o código ${parsed.data.code}.` };

  const [product] = await db.insert(schema.products).values({
    code: parsed.data.code,
    name: parsed.data.name,
    category: parsed.data.category,
    description: parsed.data.description || null,
    basePrice: parseMoney(parsed.data.basePrice),
    billingType: parsed.data.billingType,
    estimatedHours: parsed.data.estimatedHours ? parseMoney(parsed.data.estimatedHours) : "0",
    minimumMargin: parsed.data.minimumMargin ? parseMoney(parsed.data.minimumMargin) : "0",
    allowBriefingSkip: parsed.data.allowBriefingSkip === "on"
  }).returning();

  await recordAuditEvent({ actorType: "user", action: "product.created", entityType: "product", entityId: product.id, after: { code: product.code, name: product.name } });

  revalidatePath("/app/comercial/produtos");
  redirect(`/app/comercial/produtos/${product.id}`);
}

export async function updateProduct(productId: string, _prev: ProductActionState, formData: FormData): Promise<ProductActionState> {
  await requireSession();

  const parsed = productSchema.safeParse({
    code: formData.get("code"), name: formData.get("name"), category: formData.get("category"),
    description: formData.get("description"), basePrice: formData.get("basePrice"),
    billingType: formData.get("billingType"), estimatedHours: formData.get("estimatedHours"),
    minimumMargin: formData.get("minimumMargin"), allowBriefingSkip: formData.get("allowBriefingSkip")
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os campos informados." };

  const [dup] = await db.select({ id: schema.products.id }).from(schema.products)
    .where(and(eq(schema.products.code, parsed.data.code), ne(schema.products.id, productId))).limit(1);
  if (dup) return { error: `Já existe outro produto com o código ${parsed.data.code}.` };

  await db.update(schema.products).set({
    code: parsed.data.code,
    name: parsed.data.name,
    category: parsed.data.category,
    description: parsed.data.description || null,
    basePrice: parseMoney(parsed.data.basePrice),
    billingType: parsed.data.billingType,
    estimatedHours: parsed.data.estimatedHours ? parseMoney(parsed.data.estimatedHours) : "0",
    minimumMargin: parsed.data.minimumMargin ? parseMoney(parsed.data.minimumMargin) : "0",
    allowBriefingSkip: parsed.data.allowBriefingSkip === "on",
    updatedAt: new Date()
  }).where(eq(schema.products.id, productId));

  await recordAuditEvent({ actorType: "user", action: "product.updated", entityType: "product", entityId: productId });

  revalidatePath(`/app/comercial/produtos/${productId}`);
  revalidatePath("/app/comercial/produtos");
  return {};
}

export async function archiveProduct(productId: string) {
  await requireSession();
  const [product] = await db.select().from(schema.products).where(eq(schema.products.id, productId)).limit(1);
  if (!product) throw new Error("Produto não encontrado.");

  const newStatus = product.status === "archived" ? "active" : "archived";
  await db.update(schema.products).set({ status: newStatus, updatedAt: new Date() }).where(eq(schema.products.id, productId));
  await recordAuditEvent({ actorType: "user", action: newStatus === "archived" ? "product.archived" : "product.reactivated", entityType: "product", entityId: productId });

  revalidatePath(`/app/comercial/produtos/${productId}`);
  revalidatePath("/app/comercial/produtos");
}

export async function duplicateProduct(productId: string) {
  await requireSession();
  const [product] = await db.select().from(schema.products).where(eq(schema.products.id, productId)).limit(1);
  if (!product) throw new Error("Produto não encontrado.");

  let newCode = `${product.code}-COPIA`;
  let suffix = 2;
  while ((await db.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.code, newCode)).limit(1)).length > 0) {
    newCode = `${product.code}-COPIA${suffix}`;
    suffix += 1;
  }

  const [copy] = await db.insert(schema.products).values({
    code: newCode,
    name: `${product.name} (cópia)`,
    category: product.category,
    description: product.description,
    basePrice: product.basePrice,
    billingType: product.billingType,
    estimatedHours: product.estimatedHours,
    estimatedCost: product.estimatedCost,
    minimumMargin: product.minimumMargin,
    allowBriefingSkip: product.allowBriefingSkip,
    configuration: product.configuration
  }).returning();

  await recordAuditEvent({ actorType: "user", action: "product.duplicated", entityType: "product", entityId: copy.id, before: { sourceId: product.id } });

  revalidatePath("/app/comercial/produtos");
  redirect(`/app/comercial/produtos/${copy.id}`);
}

export async function listProducts(params: { q?: string; category?: string; includeArchived?: boolean }) {
  const conditions = params.includeArchived ? [] : [ne(schema.products.status, "archived")];

  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    conditions.push(or(ilike(schema.products.name, term), ilike(schema.products.code, term))!);
  }
  if (params.category) conditions.push(eq(schema.products.category, params.category));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, categories] = await Promise.all([
    db.select().from(schema.products).where(where).orderBy(asc(schema.products.category), asc(schema.products.name)),
    db.selectDistinct({ category: schema.products.category }).from(schema.products).orderBy(asc(schema.products.category))
  ]);

  return { rows, categories: categories.map((c) => c.category) };
}
