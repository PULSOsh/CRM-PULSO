import { Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { NewTicketForm } from "./new-ticket-form";

export default function NewTicketPage() {
  return (
    <>
      <PageHeader eyebrow="Operação" title="Novo chamado" description="Registro manual (telefone, WhatsApp, e-mail) em nome do cliente." />
      <Card className="max-w-xl p-6"><NewTicketForm /></Card>
    </>
  );
}
