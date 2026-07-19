import { Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { db, schema } from "@pulso/database";
import { eq } from "drizzle-orm";
import { listEligibleProductsForSkip } from "../actions";
import { CreateBriefingForm, SkipBriefingForm } from "./forms";

export default async function NewBriefingPage() {
  const [products, eligibleProducts] = await Promise.all([
    db.select({ id: schema.products.id, name: schema.products.name }).from(schema.products).where(eq(schema.products.status, "active")),
    listEligibleProductsForSkip()
  ]);

  return (
    <>
      <PageHeader eyebrow="Comercial" title="Novo briefing" description="Gere um link seguro para o cliente responder, ou registre um pulo justificado." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 font-extrabold">Enviar briefing</h2>
          <CreateBriefingForm products={products} />
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-extrabold">Pular briefing</h2>
          <p className="mb-4 text-xs text-[var(--muted)]">Somente para produtos simples marcados como elegíveis. Exige justificativa e fica registrado em auditoria.</p>
          <SkipBriefingForm eligibleProducts={eligibleProducts} />
        </Card>
      </div>
    </>
  );
}
