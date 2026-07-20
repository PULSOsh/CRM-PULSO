import "dotenv/config";
import { and, eq, notInArray } from "drizzle-orm";
import { db, pool } from "./index";
import { appSettings, briefingTemplates, pipelineStages, pipelines, products, type BriefingQuestion } from "./schema";

const briefing02Questions: BriefingQuestion[] = [
  { id: "objetivo", type: "textarea", label: "Em uma frase, o que a página precisa fazer?", required: true },
  { id: "nome_exibicao", type: "text", label: "Nome de exibição", required: true },
  { id: "descricao", type: "textarea", label: "Descrição curta (até 160 caracteres)", required: true },
  { id: "logo", type: "select", label: "Logo", required: true, options: ["Enviada", "Não possui"] },
  { id: "cores", type: "text", label: "Cores (preencha ou 'Seguir Identidade')", required: true },
  { id: "foto", type: "select", label: "Foto principal", required: true, options: ["Enviada", "Produzir/selecionar à parte"] },
  { id: "botoes", type: "textarea", label: "Quais botões devem ser incluídos? (Informe título e URL/telefone)", required: true },
  {
    id: "recursos", type: "multiselect", required: false,
    label: "Recursos adicionais",
    options: ["WhatsApp", "Instagram", "E-mail", "Localização", "PIX", "Portfólio", "Cardápio/arquivo", "Salvar contato", "QR Code", "Outro"]
  },
  { id: "observacoes", type: "textarea", label: "Observações de estilo, referências e restrições", required: false }
];

const briefing03Questions: BriefingQuestion[] = [
  { id: "objetivo", type: "textarea", label: "Como o cliente compra ou solicita orçamento hoje?", required: true },
  { id: "qtd_itens", type: "text", label: "Quantidade de itens", required: true },
  { id: "categorias", type: "textarea", label: "Categorias", required: true },
  { id: "ordem_exibicao", type: "textarea", label: "Ordem de exibição", required: false },
  { id: "cta", type: "select", label: "CTA Principal", required: true, options: ["WhatsApp", "Formulário", "Outro"] },
  { id: "preco_visivel", type: "select", label: "Preço visível?", required: true, options: ["Sim", "Não", "A partir de"] },
  { id: "estoque_visivel", type: "select", label: "Estoque visível?", required: true, options: ["Sim", "Não"] },
  {
    id: "info_itens", type: "multiselect", required: true,
    label: "Informações de cada item",
    options: ["Nome", "Código/SKU", "Descrição", "Preço", "Preço promocional", "Categoria", "Foto", "Variações", "Prazo", "Observações"]
  },
  { id: "whatsapp_pedidos", type: "text", label: "WhatsApp de pedidos", required: true },
  { id: "horario_atendimento", type: "text", label: "Horário de atendimento", required: true },
  { id: "area_atendimento", type: "text", label: "Área de atendimento", required: true },
  { id: "pagamento", type: "text", label: "Formas de pagamento", required: true },
  { id: "entrega", type: "text", label: "Entrega / Retirada", required: true },
  { id: "avisos", type: "textarea", label: "Avisos legais", required: false },
  { id: "referencias", type: "textarea", label: "Referências visuais e observações", required: false }
];

const briefing04Questions: BriefingQuestion[] = [
  { id: "o_que_faz", type: "textarea", label: "O que a empresa faz e qual problema resolve?", required: true },
  { id: "destaque", type: "textarea", label: "Quais produtos ou serviços precisam receber mais destaque?", required: true },
  { id: "diferenciais", type: "textarea", label: "Por que um cliente escolhe sua empresa em vez de outra?", required: true },
  { id: "acao", type: "select", label: "Ação principal do site", required: true, options: ["WhatsApp", "Formulário", "Compra", "Agendamento"] },
  { id: "meta", type: "text", label: "Meta inicial (ex: leads/mês, vendas)", required: true },
  { id: "trafego", type: "select", label: "Origem principal do tráfego", required: true, options: ["Orgânico", "Anúncios", "Indicação", "Outro"] },
  { id: "publico", type: "textarea", label: "Quem é o cliente ideal?", required: true },
  { id: "objecoes", type: "textarea", label: "Quais dúvidas, medos ou objeções o cliente possui?", required: true },
  {
    id: "paginas", type: "multiselect", required: true,
    label: "Páginas ou seções obrigatórias",
    options: ["Início", "Sobre", "Serviços", "Produtos", "Portfólio", "Depoimentos", "Equipe", "FAQ", "Contato", "Blog", "Políticas", "Outro"]
  },
  { id: "logo", type: "select", label: "Logo atual", required: true, options: ["Enviada em vetor", "Somente imagem", "Não possui"] },
  { id: "identidade", type: "select", label: "Identidade Visual", required: true, options: ["Completa", "Parcial", "Não possui"] },
  { id: "tom", type: "text", label: "Tom da comunicação", required: true },
  { id: "referencias_sites", type: "textarea", label: "Sites de referência", required: false },
  { id: "evitar", type: "textarea", label: "O que evitar?", required: false },
  {
    id: "recursos", type: "multiselect", required: false,
    label: "Recursos e integrações necessárias",
    options: ["Formulário", "WhatsApp", "Google Maps", "Instagram", "Analytics", "Pixel/Ads", "Agendamento", "Pagamento", "CRM", "Chat", "Área restrita", "Newsletter"]
  },
  { id: "dominio", type: "text", label: "Domínio (ex: site.com.br)", required: true },
  { id: "registrador", type: "text", label: "Registrador do domínio (ex: Registro.br, HostGator)", required: false },
  { id: "hospedagem", type: "text", label: "Hospedagem atual (se houver)", required: false },
  { id: "email_profissional", type: "text", label: "E-mail profissional (se houver)", required: false },
  { id: "seo_palavras", type: "textarea", label: "Palavras ou buscas pelas quais deseja ser encontrado no Google", required: false },
  {
    id: "seo_tecnico", type: "multiselect", required: false,
    label: "SEO técnico e conformidade",
    options: ["SEO técnico inicial", "Política de Privacidade", "Cookies", "Termos de Uso", "Acessibilidade", "Schema/dados estruturados", "Search Console", "Sitemap"]
  },
  { id: "prazo_desejado", type: "date", label: "Data desejada para conclusão", required: false },
  { id: "motivo_data", type: "text", label: "Motivo da data desejada", required: false }
];

const briefing05Questions: BriefingQuestion[] = [
  {
    id: "modelo_negocio", type: "multiselect", required: true,
    label: "Modelo de negócio",
    options: ["Produtos físicos", "Produtos digitais", "Serviços", "Assinaturas", "Atacado", "Varejo", "Sob encomenda", "Marketplace"]
  },
  { id: "qtd_produtos", type: "text", label: "Quantidade inicial de produtos", required: true },
  { id: "categorias", type: "textarea", label: "Categorias da loja", required: true },
  {
    id: "variacoes", type: "multiselect", required: false,
    label: "Variações dos produtos",
    options: ["Cor", "Tamanho", "Material", "Outra"]
  },
  { id: "estoque", type: "select", label: "Controle de estoque", required: true, options: ["Plataforma", "ERP", "Manual"] },
  { id: "fiscal", type: "text", label: "Emissão fiscal (sistema utilizado)", required: true },
  {
    id: "pagamento", type: "multiselect", required: true,
    label: "Formas de pagamento",
    options: ["PIX", "Cartão", "Boleto", "Link de pagamento", "Pagamento na retirada", "Outro"]
  },
  { id: "gateway", type: "text", label: "Gateway de pagamento pretendido (ex: MercadoPago, Pagar.me)", required: true },
  { id: "parcelamento", type: "text", label: "Regras de parcelamento", required: true },
  { id: "antifraude", type: "text", label: "Sistema antifraude (se houver)", required: false },
  {
    id: "logistica", type: "multiselect", required: true,
    label: "Entrega e logística",
    options: ["Correios", "Transportadora", "Motoboy", "Retirada", "Frete fixo", "Frete grátis", "Cálculo por CEP", "Entrega digital"]
  },
  { id: "regras_entrega", type: "textarea", label: "Regras de prazo, regiões e custos de entrega", required: true },
  { id: "trocas", type: "textarea", label: "Política de trocas e devoluções", required: true },
  { id: "garantia", type: "text", label: "Garantia dos produtos", required: true },
  { id: "atendimento", type: "textarea", label: "Canais e regras de atendimento", required: true },
  { id: "privacidade", type: "select", label: "Privacidade e Cookies", required: true, options: ["Possui", "Precisa criar"] },
  {
    id: "conteudo_produto", type: "multiselect", required: true,
    label: "O que cada produto terá de conteúdo?",
    options: ["Título", "Descrição", "Fotos", "Vídeo", "Preço", "Preço promocional", "SKU", "Peso/dimensões", "Estoque", "Variações", "SEO", "Ficha técnica"]
  },
  { id: "integracoes", type: "textarea", label: "Integrações necessárias (ex: ERP, CRM, Marketing)", required: false },
  { id: "referencias", type: "textarea", label: "Referências de lojas e observações", required: false }
];

const briefing06Questions: BriefingQuestion[] = [
  { id: "usuarios", type: "textarea", label: "Tipos de usuários", required: true },
  { id: "qtd_usuarios", type: "text", label: "Quantidade inicial de usuários", required: true },
  { id: "tenants", type: "select", label: "Empresas/Tenants", required: true, options: ["Uma empresa", "Multiempresa", "White label"] },
  { id: "permissoes", type: "textarea", label: "Como funcionam as permissões?", required: true },
  { id: "login", type: "select", label: "Forma de Login", required: true, options: ["E-mail/senha", "Google", "Outro"] },
  { id: "problema", type: "textarea", label: "Qual problema o sistema precisa resolver?", required: true },
  { id: "processo_hoje", type: "textarea", label: "Como esse processo funciona hoje?", required: true },
  { id: "impacto", type: "textarea", label: "O que acontece se nada mudar?", required: true },
  { id: "resultado_sucesso", type: "textarea", label: "Qual resultado tornaria o projeto bem-sucedido?", required: true },
  { id: "perfis_visao", type: "textarea", label: "Descreva o que cada perfil de usuário pode visualizar ou alterar", required: true },
  { id: "fluxo_principal", type: "textarea", label: "Passo a passo da atividade mais importante do sistema", required: true },
  {
    id: "dados_sensiveis", type: "multiselect", required: true,
    label: "O sistema lidará com dados sensíveis?",
    options: ["Não", "Saúde", "Biometria", "Financeiro", "Outro"]
  },
  { id: "migracao", type: "select", label: "Haverá migração de dados existentes?", required: true, options: ["Não", "Planilha", "Banco de dados", "Outro sistema"] },
  { id: "retencao", type: "text", label: "Qual a retenção necessária para histórico e backups?", required: true },
  {
    id: "entidades", type: "multiselect", required: true,
    label: "Quais informações principais precisam ser cadastradas?",
    options: ["Clientes", "Leads", "Vendas", "Produtos", "Documentos", "Agenda", "Financeiro", "Projetos", "Equipe", "Relatórios", "Arquivos", "Outro"]
  },
  {
    id: "mvp_funcionalidades", type: "multiselect", required: true,
    label: "Módulos ou funcionalidades obrigatórias do MVP (1ª versão)",
    options: ["Dashboard", "Cadastros", "Funil/Kanban", "Agenda", "Tarefas", "Relatórios", "Notificações", "Arquivos", "Configurações", "Admin", "Cobrança", "White label"]
  },
  { id: "func_futuras", type: "textarea", label: "Funcionalidades desejáveis para versões futuras", required: false },
  {
    id: "integracoes_comuns", type: "multiselect", required: false,
    label: "Integrações necessárias",
    options: ["WhatsApp oficial", "E-mail", "Google Calendar", "Meta Ads", "Google Ads", "Pagamento", "ERP", "Maps", "Webhook/API", "Armazenamento", "Assinatura", "Outra"]
  },
  { id: "sistemas_atuais", type: "textarea", label: "Detalhes de sistemas atuais, APIs e responsáveis técnicos", required: false },
  {
    id: "ia_recursos", type: "multiselect", required: true,
    label: "Inteligência Artificial (O que a IA fará?)",
    options: ["Resumo", "Classificação", "Geração de texto", "Busca inteligente", "Recomendação", "Análise de documentos", "Atendimento", "Extração de dados", "Não se aplica"]
  },
  { id: "ia_decisao", type: "textarea", label: "Qual decisão ou tarefa a IA deverá apoiar?", required: false },
  { id: "ia_exemplos", type: "textarea", label: "Exemplos de dados de entrada e da resposta/análise esperada da IA", required: false },
  { id: "indicadores", type: "textarea", label: "Quais indicadores o dashboard principal precisa mostrar?", required: true },
  { id: "aceite", type: "textarea", label: "Como saberemos que o MVP está pronto para uso e homologado?", required: true },
  { id: "infraestrutura", type: "textarea", label: "Infraestrutura (Domínio, VPS/Hospedagem, Ambientes, SLA)", required: true }
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
type CatalogItem = { code: string; name: string; category: string; basePrice: string; leadTime: string; description: string; allowBriefingSkip?: boolean; briefingTemplateCode: string };
const catalog: CatalogItem[] = [
  { code: "PROD-001", name: "Link na Bio", category: "Entrada rápida", basePrice: "197", leadTime: "2 a 3 dias úteis", allowBriefingSkip: true, briefingTemplateCode: "BRF-02",
    description: "Uma página no estilo Linktree, mas com a identidade da sua marca, seus contatos e seus links mais importantes." },
  { code: "PROD-002", name: "Cartão Digital", category: "Entrada rápida", basePrice: "297", leadTime: "2 a 4 dias úteis", allowBriefingSkip: true, briefingTemplateCode: "BRF-02",
    description: "Um cartão de visita online com contatos, serviços, redes sociais, localização, PIX e botão para salvar seus dados." },
  { code: "PROD-003", name: "Catálogo Digital", category: "Entrada rápida", basePrice: "597", leadTime: "5 a 7 dias úteis", briefingTemplateCode: "BRF-03",
    description: "Apresente produtos ou serviços em um catálogo online organizado, compartilhável e pronto para gerar pedidos pelo WhatsApp." },
  { code: "PROD-004", name: "Site Essencial", category: "Sites", basePrice: "1200", leadTime: "7 a 12 dias úteis", briefingTemplateCode: "BRF-04",
    description: "Um site profissional de uma página para apresentar sua empresa, serviços, diferenciais e formas de contato." },
  { code: "PROD-005", name: "Landing Page", category: "Sites", basePrice: "1500", leadTime: "7 a 15 dias úteis", briefingTemplateCode: "BRF-04",
    description: "Página focada em uma oferta e uma ação, indicada para tráfego pago, lançamentos, eventos e captação de leads." },
  { code: "PROD-006", name: "Site Institucional", category: "Sites", basePrice: "2500", leadTime: "15 a 25 dias úteis", briefingTemplateCode: "BRF-04",
    description: "Site com múltiplas páginas para apresentar a empresa, seus serviços, projetos, história e canais de contato." },
  { code: "PROD-007", name: "Loja Virtual Starter", category: "Sites", basePrice: "3500", leadTime: "20 a 35 dias úteis", briefingTemplateCode: "BRF-05",
    description: "Estrutura inicial de comércio eletrônico para apresentar produtos, receber pedidos e começar a vender online." },
  { code: "PROD-009", name: "Integração com IA", category: "Tecnologia", basePrice: "2000", leadTime: "10 a 20 dias úteis", briefingTemplateCode: "BRF-06",
    description: "Integre inteligência artificial a um site, sistema ou processo para resumir, classificar, gerar ou analisar informações." },
  { code: "PROD-010", name: "Automação de Processos", category: "Tecnologia", basePrice: "3000", leadTime: "15 a 25 dias úteis", briefingTemplateCode: "BRF-06",
    description: "Conecte ferramentas e automatize tarefas repetitivas para reduzir erros e liberar tempo da equipe." },
  { code: "PROD-011", name: "Sistema Web", category: "Tecnologia", basePrice: "4500", leadTime: "Prazo personalizado", briefingTemplateCode: "BRF-06",
    description: "Sistema personalizado para organizar usuários, dados, processos e regras específicas da sua operação." },
  { code: "PROD-012", name: "CRM ou Painel Operacional", category: "Tecnologia", basePrice: "5000", leadTime: "Prazo personalizado", briefingTemplateCode: "BRF-06",
    description: "Centralize leads, clientes, atividades, indicadores e etapas da operação em um ambiente criado para o seu negócio." },
  { code: "PROD-013", name: "SaaS ou White Label", category: "Tecnologia", basePrice: "6000", leadTime: "Prazo personalizado", briefingTemplateCode: "BRF-06",
    description: "Construa uma plataforma digital para vender por assinatura ou oferecer aos seus clientes com marca personalizada." },
];

async function seed() {
  // 1. Setup inicial da PULSO em appSettings
  await db.insert(appSettings)
    .values({
      id: "singleton",
      workspaceName: "PULSO",
      legalName: "Gustavo Costa Silva",
      document: "63.245.843/0001-78",
      monthlyRevenueGoal: "20000.00",
      onboardingCompletedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        workspaceName: "PULSO",
        legalName: "Gustavo Costa Silva",
        document: "63.245.843/0001-78",
        onboardingCompletedAt: new Date(),
      }
    });

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

  // 2. Inserir ou atualizar Templates de Briefing
  const templatesToInsert = [
    { name: "Briefing BRF-02 - Link na Bio e Cartão Digital", questions: briefing02Questions, isDefault: false, code: "BRF-02" },
    { name: "Briefing BRF-03 - Catálogo Digital", questions: briefing03Questions, isDefault: false, code: "BRF-03" },
    { name: "Briefing BRF-04 - Site e Landing Page", questions: briefing04Questions, isDefault: true, code: "BRF-04" },
    { name: "Briefing BRF-05 - Loja Virtual", questions: briefing05Questions, isDefault: false, code: "BRF-05" },
    { name: "Briefing BRF-06 - Sistema, CRM, SaaS e IA", questions: briefing06Questions, isDefault: false, code: "BRF-06" },
  ];

  const templateMap = new Map<string, string>(); // code -> id

  for (const t of templatesToInsert) {
    const existing = await db.select().from(briefingTemplates).where(eq(briefingTemplates.name, t.name)).limit(1);
    if (existing.length > 0) {
      await db.update(briefingTemplates)
        .set({ questions: t.questions, isDefault: t.isDefault })
        .where(eq(briefingTemplates.id, existing[0].id));
      templateMap.set(t.code, existing[0].id);
    } else {
      const [inserted] = await db.insert(briefingTemplates)
        .values({ name: t.name, version: 1, questions: t.questions, isDefault: t.isDefault })
        .returning({ id: briefingTemplates.id });
      templateMap.set(t.code, inserted.id);
    }
  }

  // 3. Atualizar Produtos e vincular ao template de briefing correspondente
  for (const item of catalog) {
    const templateId = templateMap.get(item.briefingTemplateCode);
    const values = {
      name: item.name, category: item.category, basePrice: item.basePrice, description: item.description,
      configuration: { leadTime: item.leadTime }, allowBriefingSkip: item.allowBriefingSkip ?? false, status: "active" as const,
      briefingTemplateId: templateId
    };
    await db.insert(products).values({ code: item.code, ...values }).onConflictDoUpdate({ target: products.code, set: values });
  }

  // Produtos que saíram do catálogo oficial ficam arquivados
  const currentCodes = catalog.map((item) => item.code);
  await db.update(products).set({ status: "archived" }).where(and(eq(products.status, "active"), notInArray(products.code, currentCodes)));

  console.log("Seed concluído.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => pool.end());
