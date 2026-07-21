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
  Analise os dados deste briefing e crie o rascunho de uma proposta comercial impossível de ser recusada.
  Seja direto, provocador, evite jargões de marketing genéricos, foque no problema do cliente e em como a PULSO resolverá isso (Identidade Dark/Laranja Fogo - direto ao ponto).

  VOCÊ DEVE RESPONDER ÚNICA E EXCLUSIVAMENTE COM UM OBJETO JSON VÁLIDO no seguinte formato:
  {
    "intro": "Texto introdutório acolhedor (1 parágrafo)",
    "context": "Contexto e problema entendido do cliente",
    "scopeTitle": "Título para a seção de escopo (ex: O que faremos)",
    "scopeItems": [
      {
        "name": "Nome do item",
        "description": "Descrição detalhada",
        "price": 1000
      }
    ]
  }

  Não inclua formatação markdown \`\`\`json, apenas o objeto JSON puro.
  DADOS DO BRIEFING:
  ${briefingData}`;

  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
    });
    
    // Attempt to parse JSON safely by stripping possible markdown tags
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.warn("Primary Gemini model failed, falling back...", error);
    const { text: fallbackText } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
    });
    const cleanFallback = fallbackText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanFallback);
  }
}

export async function generateContractClausesFromProposal(proposalData: string, contractCode: string): Promise<string> {
  const prompt = `Você é um advogado especialista em direito digital e contratos de prestação de serviços B2B, atuando pela agência PULSO.
  Com base nos dados da proposta abaixo, redija as CLÁUSULAS de um contrato comercial blindado, direto ao ponto e focado na entrega de valor, sem jargões jurídicos arcaicos desnecessários.
  Use formatação Markdown para títulos (### Cláusula 1 - Objeto), negritos e listas.
  O contrato deve incluir:
  - Objeto do contrato (detalhando o escopo da proposta)
  - Valor e condições de pagamento
  - Obrigações da PULSO e do Contratante
  - Prazos e Condições de Entrega
  - Propriedade Intelectual (A PULSO cede os direitos após a quitação)
  - Rescisão e Multa
  - Foro (Fortaleza, CE)

  O código deste contrato é: ${contractCode}

  DADOS DA PROPOSTA ACEITA:
  ${proposalData}
  
  Retorne APENAS o texto em Markdown das cláusulas do contrato.`;

  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
    });
    return text.trim();
  } catch (error) {
    console.warn("Primary Gemini model failed for contract, falling back...", error);
    const { text: fallbackText } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
    });
    return fallbackText.trim();
  }
}
