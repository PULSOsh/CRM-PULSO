import { PageHeader } from "@/components/page-header";
import { featureFlags } from "@pulso/integrations";
import { IntegrationsView } from "./integrations-view";
import { getIntegrationsConfig } from "./actions";

export default async function IntegrationsPage() {
  const savedConfig = await getIntegrationsConfig();

  return (
    <>
      <PageHeader 
        eyebrow="Configurações" 
        title="Integrações" 
        description="Nenhuma integração bloqueia o uso do CRM. Configure agora, teste ou deixe para depois." 
      />
      <div className="mb-5 rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4 text-sm leading-6 text-[var(--muted-strong)]">
        <strong className="text-[var(--carbon)]">Modo seguro:</strong> todos os módulos possuem alternativa manual. Erros de conexão geram aviso, mas não travam o sistema.
      </div>
      
      <IntegrationsView 
        telegramEnabled={featureFlags.telegram} 
        savedConfig={savedConfig} 
      />
    </>
  );
}
