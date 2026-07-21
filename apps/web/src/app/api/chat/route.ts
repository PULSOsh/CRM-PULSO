import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: `Você é o Copiloto da PULSO CRM. Você é um assistente estratégico especializado em vendas B2B, análise de negócios e estruturação de projetos.
Seja direto, provocador (no bom sentido) e focado em gerar valor. Use formatação Markdown (negrito, listas) para tornar a leitura dinâmica.
Não use jargões difíceis à toa. Sempre que possível, seja conciso e foque no problema/solução.`,
    messages,
  });

  return result.toDataStreamResponse();
}
