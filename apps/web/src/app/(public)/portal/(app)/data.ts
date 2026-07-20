import "server-only";
import { db, schema } from "@pulso/database";
import { and, desc, eq, isNull, ne } from "drizzle-orm";

export async function getAccessibleProjects(portalUserId: string) {
  return db.select({ project: schema.projects })
    .from(schema.portalPermissions)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.portalPermissions.projectId))
    .where(eq(schema.portalPermissions.portalUserId, portalUserId))
    .orderBy(desc(schema.projects.createdAt))
    .then((rows) => rows.map((r) => r.project));
}

export async function getAccessibleProject(portalUserId: string, projectId: string) {
  const [row] = await db.select({ project: schema.projects })
    .from(schema.portalPermissions)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.portalPermissions.projectId))
    .where(and(eq(schema.portalPermissions.portalUserId, portalUserId), eq(schema.portalPermissions.projectId, projectId)))
    .limit(1);
  return row?.project ?? null;
}

export async function getClientApprovals(projectId: string) {
  return db.select().from(schema.approvals).where(eq(schema.approvals.projectId, projectId)).orderBy(desc(schema.approvals.round));
}

export async function getClientFiles(projectId: string) {
  return db.select().from(schema.files)
    .where(and(eq(schema.files.entityType, "project"), eq(schema.files.entityId, projectId), eq(schema.files.visibility, "client"), isNull(schema.files.trashedAt)))
    .orderBy(desc(schema.files.createdAt));
}

export async function getCompanyTickets(companyId: string) {
  return db.select().from(schema.tickets).where(eq(schema.tickets.companyId, companyId)).orderBy(desc(schema.tickets.createdAt));
}

export async function getTicketForCompany(ticketId: string, companyId: string) {
  const [ticket] = await db.select().from(schema.tickets).where(and(eq(schema.tickets.id, ticketId), eq(schema.tickets.companyId, companyId))).limit(1);
  if (!ticket) return null;
  const messages = await db.select().from(schema.ticketMessages)
    .where(and(eq(schema.ticketMessages.ticketId, ticketId), ne(schema.ticketMessages.visibility, "internal")))
    .orderBy(schema.ticketMessages.createdAt);
  return { ticket, messages };
}
