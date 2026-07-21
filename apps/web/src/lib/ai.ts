import { generateObject, generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateProposalDraftFromBriefing(briefingData: string) {
  // Llama 3 8B or 70B is available on Groq. "llama3-8b-8192" or "llama3-70b-8192"
  const model = groq("llama3-70b-8192"); 

  const result = await generateObject({
    model,
    schema: z.object({
      intro: z.string().describe("Texto introdutório acolhedor (1 parágrafo)"),
      context: z.string().describe("Contexto e problema entendido do cliente"),
      scopeTitle: z.string().describe("Título para a seção de escopo (ex: O que faremos)"),
      scopeItems: z.array(z.object({
        name: z.string(),
        description: z.string(),
        price: z.number().optional(),
      })).describe("Lista de itens sugeridos baseados no briefing"),
    }),
    prompt: `Você é o estrategista comercial da agência/consultoria PULSO.
    Analise os dados deste briefing e crie o rascunho de uma proposta comercial impossível de ser recusada.
    Seja direto, provocador, evite jargões de marketing genéricos, foque no problema do cliente e em como a PULSO resolverá isso (Identidade Dark/Laranja Fogo - direto ao ponto).

    DADOS DO BRIEFING:
    ${briefingData}`,
  });

  return result.object;
}
