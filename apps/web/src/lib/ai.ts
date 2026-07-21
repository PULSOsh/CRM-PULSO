import { generateObject, generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
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
      model: groq("llama-3.3-70b-versatile"),
      prompt,
    });
    
    // Attempt to parse JSON safely by stripping possible markdown tags
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.warn("Primary Groq model failed, falling back to instant model...", error);
    // Fallback model
    const { text: fallbackText } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
    });
    const cleanFallback = fallbackText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanFallback);
  }
}
