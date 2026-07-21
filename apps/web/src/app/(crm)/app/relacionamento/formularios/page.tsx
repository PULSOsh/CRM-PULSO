import { PageHeader } from "@/components/page-header";
import { Plus, ExternalLink, Activity, Users, Copy } from "lucide-react";
import { Badge, Card, Button } from "@pulso/ui";

const DUMMY_FORMS = [
  { id: 1, title: "Briefing Inicial - Branding", provider: "Typeform", submissions: 12, status: "active", lastResponse: "Hoje às 09:40" },
  { id: 2, title: "Pesquisa de NPS (Trimestre 3)", provider: "Google Forms", submissions: 45, status: "active", lastResponse: "Ontem" },
  { id: 3, title: "Formulário de Contato - Site", provider: "Webflow", submissions: 128, status: "active", lastResponse: "Há 2 horas" },
  { id: 4, title: "Inscrição Evento Anual", provider: "Typeform", submissions: 310, status: "closed", lastResponse: "Mês passado" }
];

export default function FormulariosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Relacionamento"
        title="Formulários Públicos"
        description="Gerencie seus formulários externos e acompanhe respostas captadas."
        actions={<Button className="shadow-lg shadow-orange-500/20"><Plus className="size-4 mr-2" />Novo Formulário</Button>}
      />

      <div className="mt-8 grid gap-4">
        {DUMMY_FORMS.map((form) => (
          <Card key={form.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-6 hover:border-white/20 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge tone={form.status === "active" ? "success" : "neutral"} className={form.status === "active" ? "bg-emerald-500/10 text-emerald-500 border-none" : "bg-white/5 text-gray-500 border-none"}>
                  {form.status === "active" ? "Ativo" : "Fechado"}
                </Badge>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{form.provider}</span>
              </div>
              <h3 className="text-lg font-extrabold text-white">{form.title}</h3>
              <div className="mt-4 flex items-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><Users className="size-4 text-orange-500" /> {form.submissions} respostas</span>
                <span className="flex items-center gap-2"><Activity className="size-4 text-orange-500" /> Última: {form.lastResponse}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-gray-300 transition-colors hover:bg-white/10">
                <Copy className="size-4" /> Link
              </button>
              <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-gray-300 transition-colors hover:bg-white/10">
                Respostas <ExternalLink className="size-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
