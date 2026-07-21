import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

type ProposalDraft = {
  intro: string;
  context: string;
  scopeTitle: string;
  scopeItems: Array<{
    name: string;
    description: string;
    price?: number;
  }>;
};

export async function generateProposalDraftFromBriefing(briefingData: string): Promise<ProposalDraft> {

  const prompt = `Você é o estrategista comercial da agência/consultoria PULSO.
  Analise os dados deste briefing e crie o rascunho de uma proposta comercial altamente personalizada e impossível de ser recusada.
  Seja direto, provocador, evite jargões de marketing genéricos, foque exatamente no problema trazido pelo cliente e em como a PULSO resolverá isso.

  REGRAS OBRIGATÓRIAS:
  1. O campo "context" deve resumir com precisão a dor, o objetivo e os detalhes trazidos pelo cliente no briefing.
  2. O campo "scopeItems" DEVE incluir EXATAMENTE cada um dos itens, serviços, entregáveis ou necessidades mencionadas no briefing. Não omita nenhum requisito solicitado pelo cliente.
  3. Estime preços adequados para cada item do escopo (em Reais R$).

  VOCÊ DEVE RESPONDER ÚNICA E EXCLUSIVAMENTE COM UM OBJETO JSON VÁLIDO no seguinte formato:
  {
    "intro": "Texto introdutório acolhedor e direto ao ponto (1 parágrafo)",
    "context": "Contexto e entendimento profundo da necessidade do cliente",
    "scopeTitle": "Título para a seção de escopo (ex: O que entregaremos)",
    "scopeItems": [
      {
        "name": "Nome do item/serviço",
        "description": "Descrição detalhada do entregável",
        "price": 1500
      }
    ]
  }

  Não inclua formatação markdown \`\`\`json, apenas o objeto JSON puro.

  DADOS DO BRIEFING DO CLIENTE:
  ${briefingData}`;

  try {
    const { text } = await generateText({
      model: google("gemini-flash-latest"),
      prompt,
    });
    
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.warn("Primary Gemini model failed for proposal draft, retrying...", error);
    const { text: fallbackText } = await generateText({
      model: google("gemini-flash-latest"),
      prompt,
    });
    const cleanFallback = fallbackText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanFallback);
  }
}

export async function generateContractClausesFromProposal(proposalData: string, contractCode: string): Promise<string> {
  const prompt = `Você é um advogado especialista em direito digital e contratos de prestação de serviços B2B, atuando pela agência PULSO.
  Com base em TODOS os dados da proposta comercial abaixo, redija as CLÁUSULAS de um contrato comercial blindado, direto ao ponto e focado na entrega de valor.

  REGRAS OBRIGATÓRIAS:
  - O contrato DEVE espelhar rigorosamente todos os itens do escopo, valores e condições contidos na proposta aceita.
  - Use formatação Markdown para títulos (### Cláusula 1 - Objeto), negritos e listas.
  - O contrato deve incluir obrigatoriamente:
    ### Cláusula 1 - Objeto (Detalhamento completo de cada item do escopo da proposta)
    ### Cláusula 2 - Valor e Condições de Pagamento (Valores exatos e formas de pagamento aceitas)
    ### Cláusula 3 - Obrigações da PULSO e do Contratante
    ### Cláusula 4 - Prazos e Entregas
    ### Cláusula 5 - Propriedade Intelectual (Cessão de direitos após quitação total)
    ### Cláusula 6 - Rescisão e Penalidades
    ### Cláusula 7 - Foro de Eleição (Comarca de Fortaleza, CE)

  O código deste contrato é: ${contractCode}

  DADOS COMPLETOS DA PROPOSTA ACEITA:
  ${proposalData}
  
  Retorne APENAS o texto em Markdown das cláusulas do contrato.`;

  try {
    const { text } = await generateText({
      model: google("gemini-flash-latest"),
      prompt,
    });
    return text.trim();
  } catch (error) {
    console.warn("Primary Gemini model failed for contract, retrying...", error);
    const { text: fallbackText } = await generateText({
      model: google("gemini-flash-latest"),
      prompt,
    });
    return fallbackText.trim();
  }
}
