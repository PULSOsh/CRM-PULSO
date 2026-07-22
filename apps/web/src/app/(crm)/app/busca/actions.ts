"use server";

import { db, schema } from "@pulso/database";
import { ilike, or } from "drizzle-orm";

export type SearchResultItem = {
  id: string;
  type: "lead" | "opportunity" | "contact" | "project" | "proposal";
  title: string;
  subtitle: string;
  href: string;
  code?: string;
};

export async function globalSearch(query: string): Promise<SearchResultItem[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const pattern = `%${q}%`;
  const results: SearchResultItem[] = [];

  try {
    // 1. Leads
    const leads = await db
      .select()
      .from(schema.leads)
      .where(or(ilike(schema.leads.name, pattern), ilike(schema.leads.code, pattern), ilike(schema.leads.email, pattern), ilike(schema.leads.companyName, pattern)))
      .limit(5);

    leads.forEach((l) => {
      results.push({
        id: l.id,
        type: "lead",
        title: l.name,
        subtitle: l.companyName ? `${l.companyName} • Lead ${l.code}` : `Lead ${l.code}`,
        href: `/app/comercial/leads/${l.id}`,
        code: l.code,
      });
    });

    // 2. Oportunidades
    const opps = await db
      .select()
      .from(schema.opportunities)
      .where(or(ilike(schema.opportunities.title, pattern), ilike(schema.opportunities.code, pattern)))
      .limit(5);

    opps.forEach((o) => {
      results.push({
        id: o.id,
        type: "opportunity",
        title: o.title,
        subtitle: `Oportunidade ${o.code} • R$ ${Number(o.expectedValue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        href: `/app/comercial/oportunidades/${o.id}`,
        code: o.code,
      });
    });

    // 3. Contatos / Clientes
    const contactsList = await db
      .select()
      .from(schema.contacts)
      .where(or(ilike(schema.contacts.name, pattern), ilike(schema.contacts.email, pattern), ilike(schema.contacts.phone, pattern)))
      .limit(5);

    contactsList.forEach((c) => {
      results.push({
        id: c.id,
        type: "contact",
        title: c.name,
        subtitle: c.email || c.phone || `Contato ${c.code}`,
        href: `/app/comercial/contatos/${c.id}`,
        code: c.code,
      });
    });

    // 4. Projetos
    const projectsList = await db
      .select()
      .from(schema.projects)
      .where(or(ilike(schema.projects.name, pattern), ilike(schema.projects.code, pattern)))
      .limit(5);

    projectsList.forEach((p) => {
      results.push({
        id: p.id,
        type: "project",
        title: p.name,
        subtitle: `Projeto ${p.code}`,
        href: `/app/operacao/projetos/${p.id}`,
        code: p.code,
      });
    });

    // 5. Propostas
    const proposalsList = await db
      .select()
      .from(schema.proposals)
      .where(or(ilike(schema.proposals.code, pattern), ilike(schema.proposals.publicSlug, pattern)))
      .limit(5);

    proposalsList.forEach((pr) => {
      results.push({
        id: pr.id,
        type: "proposal",
        title: `Proposta ${pr.code}`,
        subtitle: `Status: ${pr.status}`,
        href: `/app/comercial/propostas/${pr.id}`,
        code: pr.code,
      });
    });
  } catch (error) {
    console.error("Global search error:", error);
  }

  return results;
}
