import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { db, schema } from '@pulso/database';
import { desc } from 'drizzle-orm';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

function normalizeMessages(messages: any[]) {
  return messages.map((msg: any) => {
    if (typeof msg.content === 'string') {
      return { role: msg.role, content: msg.content };
    }
    if (Array.isArray(msg.parts)) {
      const text = msg.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
      return { role: msg.role, content: text };
    }
    if (Array.isArray(msg.content)) {
      const text = msg.content
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
      return { role: msg.role, content: text };
    }
    return { role: msg.role, content: '' };
  });
}

async function fetchCrmContextSnapshot() {
  try {
    const [recentOpps, recentProposals, recentContracts, recentLeads, recentProjects] = await Promise.all([
      db.select({ title: schema.opportunities.title, code: schema.opportunities.code, status: schema.opportunities.status, value: schema.opportunities.expectedValue })
        .from(schema.opportunities).orderBy(desc(schema.opportunities.createdAt)).limit(8),
      db.select({ code: schema.proposals.code, status: schema.proposals.status })
        .from(schema.proposals).orderBy(desc(schema.proposals.createdAt)).limit(8),
      db.select({ code: schema.contracts.code, status: schema.contracts.status })
        .from(schema.contracts).orderBy(desc(schema.contracts.createdAt)).limit(8),
      db.select({ name: schema.leads.name, status: schema.leads.status })
        .from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(8),
      db.select({ name: schema.projects.name, status: schema.projects.status })
        .from(schema.projects).orderBy(desc(schema.projects.createdAt)).limit(8),
    ]);

    const oppsText = recentOpps.map(o => `- ${o.code}: "${o.title}" (Status: ${o.status}, Valor: R$ ${o.value})`).join('\n') || 'Nenhuma recente.';
    const propText = recentProposals.map(p => `- Proposta ${p.code} (Status: ${p.status})`).join('\n') || 'Nenhuma recente.';
    const contText = recentContracts.map(c => `- Contrato ${c.code} (Status: ${c.status})`).join('\n') || 'Nenhum recente.';
    const leadsText = recentLeads.map(l => `- Lead: "${l.name}" (Status: ${l.status})`).join('\n') || 'Nenhum recente.';
    const projText = recentProjects.map(pr => `- Projeto: "${pr.name}" (Status: ${pr.status})`).join('\n') || 'Nenhum recente.';

    return `
=== CONTEXTO EM TEMPO REAL DO BANCO DE DADOS DO PULSO CRM ===

[OPORTUNIDADES RECENTES NO FUNIL DE VENDAS]
${oppsText}

[PROPOSTAS COMERCIAIS RECENTES]
${propText}

[CONTRATOS RECENTES]
${contText}

[LEADS RECENTES]
${leadsText}

[PROJETOS OPERACIONAIS RECENTES]
${projText}
`;
  } catch (err) {
    console.error("Failed to fetch CRM snapshot for AI assistant", err);
    return "Dados do CRM indisponíveis no momento.";
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const normalized = normalizeMessages(messages);
    const crmContext = await fetchCrmContextSnapshot();

    const result = streamText({
      model: google('gemini-flash-latest'),
      system: `Você é o Copiloto da PULSO CRM. Você é um assistente estratégico especializado em vendas B2B, análise de negócios e estruturação de projetos.
Você tem acesso aos dados reais e atualizados do sistema CRM fornecidos abaixo. Utilize esses dados sempre que o usuário perguntar sobre propostas, contratos, oportunidades, projetos ou leads.

${crmContext}

DIRETRIZES DE RESPOSTA:
1. Seja direto, provocador (no bom sentido) e focado em gerar valor comercial.
2. Use formatação Markdown refinada (negrito, listas de tópicos, tabelas quando apropriado).
3. Não use jargões difíceis à toa. Sempre que possível, seja conciso e foque no problema/solução.
4. Responda sempre em Português do Brasil.`,
      messages: normalized,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('[CHAT API ERROR]', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno na API de IA.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
