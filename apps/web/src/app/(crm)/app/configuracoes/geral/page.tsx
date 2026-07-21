import { PageHeader } from "@/components/page-header";
import { Card, Input, Label, Button } from "@pulso/ui";

export default function ConfigGeralPage() {
  return (
    <>
      <PageHeader
        eyebrow="Configurações"
        title="Geral e Identidade"
        description="Configure os dados da sua empresa para emissão de propostas e contratos."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-extrabold text-white mb-6">Dados da Empresa (Contratada)</h2>
          <form className="space-y-4">
            <div>
              <Label>Nome / Razão Social</Label>
              <Input defaultValue="PULSO AGÊNCIA" />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input defaultValue="00.000.000/0001-00" />
            </div>
            <div>
              <Label>Endereço Completo</Label>
              <Input defaultValue="Av. Paulista, 1000 - São Paulo, SP" />
            </div>
            <div>
              <Label>E-mail de Contato (Padrão)</Label>
              <Input defaultValue="contato@pulso.cx" />
            </div>
            <div className="pt-2">
              <Button type="button">Salvar Dados</Button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-extrabold text-white mb-6">Identidade Visual (Propostas)</h2>
          <form className="space-y-4">
            <div>
              <Label>Cor Primária (Hex)</Label>
              <div className="flex gap-4">
                <div className="size-10 rounded-lg bg-orange-500 shadow-inner" />
                <Input defaultValue="#F97316" className="flex-1" />
              </div>
            </div>
            <div>
              <Label>Logo Escura (URL)</Label>
              <Input defaultValue="https://pulso.cx/logo-dark.png" />
            </div>
            <div>
              <Label>Logo Clara (URL)</Label>
              <Input defaultValue="https://pulso.cx/logo-light.png" />
            </div>
            <div className="pt-2">
              <Button type="button">Salvar Identidade</Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
