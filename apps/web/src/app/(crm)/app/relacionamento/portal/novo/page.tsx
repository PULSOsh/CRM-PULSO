import { Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { InviteForm } from "./invite-form";

export default function NewPortalUserPage() {
  return (
    <>
      <PageHeader eyebrow="Relacionamento" title="Convidar usuário do portal" description="O link de ativação só é exibido uma vez — copie antes de sair da página." />
      <Card className="max-w-xl p-6">
        <InviteForm />
      </Card>
    </>
  );
}
