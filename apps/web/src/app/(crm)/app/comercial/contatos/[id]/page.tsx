import { db, schema } from "@pulso/database";
import { Card } from "@pulso/ui";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { trashContact } from "../actions";
import { ContactEditForm } from "./edit-form";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, id)).limit(1);
  if (!contact) notFound();

  const links = await db.select({ company: schema.companies })
    .from(schema.companyContacts)
    .innerJoin(schema.companies, eq(schema.companies.id, schema.companyContacts.companyId))
    .where(eq(schema.companyContacts.contactId, id));

  return (
    <>
      <PageHeader
        eyebrow={contact.code}
        title={contact.name}
        actions={
          <form action={trashContact.bind(null, contact.id)}>
            <button type="submit" className="secondary-button">Mover para lixeira</button>
          </form>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <Card className="p-6">
          <h2 className="mb-4 font-extrabold">Dados de contato</h2>
          <ContactEditForm contact={contact} />
        </Card>
        <Card className="p-6">
          <h2 className="font-extrabold">Empresas vinculadas</h2>
          <div className="mt-4 space-y-3">
            {links.length === 0 && <p className="text-sm text-[var(--muted)]">Nenhuma empresa vinculada.</p>}
            {links.map(({ company }) => (
              <Link key={company.id} href={`/app/comercial/contatos/empresas/${company.id}`} className="block rounded-xl border border-[var(--line)] p-3 hover:border-[var(--signal)]">
                <p className="text-sm font-bold">{company.tradeName}</p>
                <p className="text-xs text-[var(--muted)]">{company.segment ?? "—"}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
