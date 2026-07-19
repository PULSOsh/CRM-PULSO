import { db, schema } from "@pulso/database";
import { Badge, Card } from "@pulso/ui";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { archiveProduct, duplicateProduct } from "../actions";
import { ProductEditForm } from "./edit-form";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product] = await db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        eyebrow={product.code}
        title={product.name}
        actions={
          <>
            <form action={duplicateProduct.bind(null, product.id)}>
              <button type="submit" className="secondary-button">Duplicar</button>
            </form>
            <form action={archiveProduct.bind(null, product.id)}>
              <button type="submit" className="secondary-button">{product.status === "archived" ? "Reativar" : "Arquivar"}</button>
            </form>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <Card className="p-6">
          <h2 className="mb-4 font-extrabold">Dados do produto</h2>
          <ProductEditForm product={product} />
        </Card>
        <Card className="p-6">
          <h2 className="font-extrabold">Status</h2>
          <div className="mt-4"><Badge tone={product.status === "archived" ? "neutral" : "success"}>{product.status === "archived" ? "Arquivado" : "Ativo"}</Badge></div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">Produtos arquivados não aparecem para novas propostas, mas permanecem disponíveis em propostas já criadas.</p>
        </Card>
      </div>
    </>
  );
}
