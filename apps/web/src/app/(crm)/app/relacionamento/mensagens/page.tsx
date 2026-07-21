import { PageHeader } from "@/components/page-header";
import { db, schema } from "@pulso/database";
import { desc } from "drizzle-orm";
import { LiveChatView } from "./live-chat-view";
import { addRelationshipActivity } from "./actions";

export default async function MensagensPage() {
  const [leadsList, activitiesList] = await Promise.all([
    db.select({
      id: schema.leads.id,
      name: schema.leads.name,
      email: schema.leads.email,
      phone: schema.leads.phone,
      companyName: schema.leads.companyName,
      service: schema.leads.service,
      status: schema.leads.status,
      createdAt: schema.leads.createdAt,
    }).from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(50),
    
    db.select({
      id: schema.activities.id,
      entityId: schema.activities.entityId,
      type: schema.activities.type,
      summary: schema.activities.summary,
      createdBy: schema.activities.createdBy,
      occurredAt: schema.activities.occurredAt,
    }).from(schema.activities).orderBy(desc(schema.activities.occurredAt)).limit(100)
  ]);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        eyebrow="Relacionamento"
        title="Mensagens e Histórico"
        description="Inbox unificada e histórico de interações por cliente."
      />

      <LiveChatView 
        clients={leadsList} 
        initialActivities={activitiesList} 
        addActivityAction={addRelationshipActivity}
      />
    </div>
  );
}
