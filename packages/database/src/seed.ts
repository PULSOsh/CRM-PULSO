import "dotenv/config";
import { and, eq, notInArray } from "drizzle-orm";
import { db, pool } from "./index";
import { briefingTemplates, pipelineStages, pipelines, products, type BriefingQuestion } from "./schema";

const defaultBriefingQuestions: BriefingQuestion[] = [
  { id: "objetivo", type: "textarea", label: "Qual o principal objetivo deste projeto?", required: true },
  { id: "publico", type: "textarea", label: "Quem é o público-alvo?", required: true },
  { id: "referencias", type: "link", label: "Link de referências (sites, redes sociais, concorrentes)", required: false },
  { id: "diferenciais", type: "textarea", label: "Quais são os diferenciais do seu negócio?", required: true },
  { id: "conteudo_pronto", type: "boolean", label: "Você já tem textos, fotos e logo prontos?", required: true },
  { id: "prazo_desejado", type: "date", label: "Existe um prazo desejado para conclusão?", required: false },
  { id: "orcamento_aproximado", type: "currency", label: "Orçamento aproximado disponível (opcional)", required: false },
  {
    id: "resultados_importantes", type: "multiselect", required: true,
    label: "Quais resultados são mais importantes?",
    options: ["Gerar contatos", "Apresentar serviços", "Transmitir confiança", "Facilitar agendamentos", "Vender online", "Educar o público"]
  },
  { id: "observacoes", type: "textarea", label: "Outras observações importantes", required: false }
];

const mainStages = [
  "Novo lead",
  "Primeiro contato",
  "Qualificação",
  "Briefing solicitado",
  "Briefing recebido",
  "Diagnóstico",
  "Proposta em preparação",
  "Proposta enviada",
  "Negociação",
  "Fechado — ganho",
  "Fechado — perdido",
];

// Catálogo real da PULSO (fonte: catalogo.pulso.cloud, snapshot em D:\PULSO\PULSO_CATALOGO_PRODUTOS_V3_WHATSAPP\catalogo.md).
// allowBriefingSkip: true apenas para produtos de presença digital simples, sem escopo
// suficiente para justificar o questionário completo (regra: "pular exige produto elegível").
type CatalogItem = { code: string; name: string; category: string; basePrice: string; leadTime: string; description: string; allowBriefingSkip?: boolean };
const catalog: CatalogItem[] = [
  { code: "PROD-001", name: "Link na Bio", category: "Entrada rápida", basePrice: "197", leadTime: "2 a 3 dias úteis", allowBriefingSkip: true,
    description: "Uma página no estilo Linktree, mas com a identidade da sua marca, seus contatos e seus links mais importantes." },
  { code: "PROD-002", name: "Cartão Digital", category: "Entrada rápida", basePrice: "297", leadTime: "2 a 4 dias úteis", allowBriefingSkip: true,
    description: "Um cartão de visita online com contatos, serviços, redes sociais, localização, PIX e botão para salvar seus dados." },
  { code: "PROD-003", name: "Catálogo Digital", category: "Entrada rápida", basePrice: "597", leadTime: "5 a 7 dias úteis",
    description: "Apresente produtos ou serviços em um catálogo online organizado, compartilhável e pronto para gerar pedidos pelo WhatsApp." },
  { code: "PROD-004", name: "Site Essencial", category: "Sites", basePrice: "1200", leadTime: "7 a 12 dias úteis",
    description: "Um site profissional de uma página para apresentar sua empresa, serviços, diferenciais e formas de contato." },
  { code: "PROD-005", name: "Landing Page", category: "Sites", basePrice: "1500", leadTime: "7 a 15 dias úteis",
    description: "Página focada em uma oferta e uma ação, indicada para tráfego pago, lançamentos, eventos e captação de leads." },
  { code: "PROD-006", name: "Site Institucional", category: "Sites", basePrice: "2500", leadTime: "15 a 25 dias úteis",
    description: "Site com múltiplas páginas para apresentar a empresa, seus serviços, projetos, história e canais de contato." },
  { code: "PROD-007", name: "Loja Virtual Starter", category: "Sites", basePrice: "3500", leadTime: "20 a 35 dias úteis",
    description: "Estrutura inicial de comércio eletrônico para apresentar produtos, receber pedidos e começar a vender online." },
  { code: "PROD-009", name: "Integração com IA", category: "Tecnologia", basePrice: "2000", leadTime: "10 a 20 dias úteis",
    description: "Integre inteligência artificial a um site, sistema ou processo para resumir, classificar, gerar ou analisar informações." },
  { code: "PROD-010", name: "Automação de Processos", category: "Tecnologia", basePrice: "3000", leadTime: "15 a 25 dias úteis",
    description: "Conecte ferramentas e automatize tarefas repetitivas para reduzir erros e liberar tempo da equipe." },
  { code: "PROD-011", name: "Sistema Web", category: "Tecnologia", basePrice: "4500", leadTime: "Prazo personalizado",
    description: "Sistema personalizado para organizar usuários, dados, processos e regras específicas da sua operação." },
  { code: "PROD-012", name: "CRM ou Painel Operacional", category: "Tecnologia", basePrice: "5000", leadTime: "Prazo personalizado",
    description: "Centralize leads, clientes, atividades, indicadores e etapas da operação em um ambiente criado para o seu negócio." },
  { code: "PROD-013", name: "SaaS ou White Label", category: "Tecnologia", basePrice: "6000", leadTime: "Prazo personalizado",
    description: "Construa uma plataforma digital para vender por assinatura ou oferecer aos seus clientes com marca personalizada." },
];

async function seed() {
  const [pipeline] = await db
    .insert(pipelines)
    .values({ name: "Pipeline comercial principal", kind: "sales", isDefault: true })
    .onConflictDoNothing()
    .returning();

  if (pipeline) {
    await db.insert(pipelineStages).values(
      mainStages.map((name, position) => ({
        pipelineId: pipeline.id,
        name,
        position,
        defaultProbability: Math.min(position * 10, 100),
      })),
    );
  }

  for (const item of catalog) {
    const values = {
      name: item.name, category: item.category, basePrice: item.basePrice, description: item.description,
      configuration: { leadTime: item.leadTime }, allowBriefingSkip: item.allowBriefingSkip ?? false, status: "active" as const
    };
    await db.insert(products).values({ code: item.code, ...values }).onConflictDoUpdate({ target: products.code, set: values });
  }

  // Produtos que saíram do catálogo oficial (ex.: itens de exemplo fabricados numa versão anterior
  // do seed) ficam arquivados em vez de apagados -- preserva histórico de propostas/contratos antigos.
  const currentCodes = catalog.map((item) => item.code);
  await db.update(products).set({ status: "archived" }).where(and(eq(products.status, "active"), notInArray(products.code, currentCodes)));

  const [existingTemplate] = await db.select({ id: briefingTemplates.id }).from(briefingTemplates).where(eq(briefingTemplates.isDefault, true)).limit(1);
  if (!existingTemplate) {
    await db.insert(briefingTemplates).values({ name: "Briefing padrão", version: 1, questions: defaultBriefingQuestions, isDefault: true });
  }

  console.log("Seed concluído.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => pool.end());
