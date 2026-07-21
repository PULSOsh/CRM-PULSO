import { PageHeader } from "@/components/page-header";
import { GeralForms } from "./forms";
import { db, schema } from "@pulso/database";
import { eq } from "drizzle-orm";

export default async function ConfigGeralPage() {
  const [settings] = await db
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.id, "singleton"))
    .limit(1);

  return (
    <>
      <PageHeader
        eyebrow="Configurações"
        title="Geral e Identidade"
        description="Configure os dados da sua empresa para emissão de propostas e contratos."
      />

      <GeralForms settings={settings ?? null} />
    </>
  );
}
