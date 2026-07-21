import { generateObject, generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateProposalDraftFromBriefing(briefingData: string) {
  const schema = z.object({
    intro: z.string().describe("Texto introdutório acolhedor (1 parágrafo)"),
    context: z.string().describe("Contexto e problema entendido do cliente"),
    scopeTitle: z.string().describe("Título para a seção de escopo (ex: O que faremos)"),
    scopeItems: z.array(z.object({
      name: z.string(),
      description: z.string(),
      price: z.number().optional(),
    })).describe("Lista de itens sugeridos baseados no briefing"),
  });

  const prompt = `Você é o estrategista comercial da agência/consultoria PULSO.
  Analise os dados deste briefing e crie o rascunho de uma proposta comercial impossível de ser recusada.
  Seja direto, provocador, evite jargões de marketing genéricos, foque no problema do cliente e em como a PULSO resolverá isso (Identidade Dark/Laranja Fogo - direto ao ponto).

  DADOS DO BRIEFING:
  ${briefingData}`;

  try {
    const result = await generateObject({
      model: groq("llama-3.3-70b-versatile"),
      schema,
      prompt,
    });
    return result.object;
  } catch (error) {
    console.warn("Primary Groq model failed, falling back to instant model...", error);
    // Fallback model
    const fallbackResult = await generateObject({
      model: groq("llama-3.1-8b-instant"),
      schema,
      prompt,
    });
    return fallbackResult.object;
  }
}
