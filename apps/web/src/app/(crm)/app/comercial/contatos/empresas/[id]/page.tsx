import { db, schema } from "@pulso/database";
import { Card } from "@pulso/ui";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { trashCompany, unlinkContactFromCompany } from "../../actions";
import { CompanyEditForm } from "./edit-form";
import { LinkContactWidget } from "./link-contact";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [company] = await db.select().from(schema.companies).where(eq(schema.companies.id, id)).limit(1);
  if (!company) notFound();

  const links = await db.select({ contact: schema.contacts })
    .from(schema.companyContacts)
    .innerJoin(schema.contacts, eq(schema.contacts.id, schema.companyContacts.contactId))
    .where(eq(schema.companyContacts.companyId, id));

  return (
    <>
      <PageHeader
        eyebrow={company.code}
        title={company.tradeName}
        actions={
          <form action={trashCompany.bind(null, company.id)}>
            <button type="submit" className="secondary-button">Mover para lixeira</button>
          </form>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <Card className="p-6">
          <h2 className="mb-4 font-extrabold">Dados da empresa</h2>
          <CompanyEditForm company={company} />
        </Card>
        <Card className="p-6">
          <h2 className="font-extrabold">Contatos vinculados</h2>
          <div className="mt-4 space-y-3">
            {links.length === 0 && <p className="text-sm text-[var(--muted)]">Nenhum contato vinculado.</p>}
            {links.map(({ contact }) => (
              <div key={contact.id} className="flex items-center justify-between gap-2 rounded-xl border border-[var(--line)] p-3">
                <Link href={`/app/comercial/contatos/${contact.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold hover:underline">{contact.name}</p>
                  <p className="truncate text-xs text-[var(--muted)]">{contact.email ?? contact.phone ?? "—"}</p>
                </Link>
                <form action={unlinkContactFromCompany.bind(null, company.id, contact.id)}>
                  <button type="submit" className="text-xs font-bold text-[var(--muted)] hover:text-[var(--carbon)]">Desvincular</button>
                </form>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <LinkContactWidget companyId={company.id} />
          </div>
        </Card>
      </div>
    </>
  );
}
