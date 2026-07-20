import { Card } from "@pulso/ui";
import { getPortalSession } from "@/lib/portal-auth";
import { getAccessibleProjects } from "../../data";
import { NewTicketForm } from "./new-ticket-form";

export default async function NewTicketPage() {
  const portalUser = await getPortalSession();
  if (!portalUser) return null;
  const projects = await getAccessibleProjects(portalUser.id);

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-[-0.05em]">Abrir chamado</h1>
      <Card className="mt-6 p-6"><NewTicketForm projects={projects} /></Card>
    </main>
  );
}
