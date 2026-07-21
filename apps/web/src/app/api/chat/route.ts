import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// AI SDK v4 sends messages with `parts` array instead of `content` string.
// We need to convert them to the format the AI provider expects.
function normalizeMessages(messages: any[]) {
  return messages.map((msg: any) => {
    // If message already has content as string, use it directly
    if (typeof msg.content === 'string') {
      return { role: msg.role, content: msg.content };
    }
    // If message has parts array (AI SDK v4 UIMessage format), extract text
    if (Array.isArray(msg.parts)) {
      const text = msg.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
      return { role: msg.role, content: text };
    }
    // If message has content as array (OpenAI format), extract text
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

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const normalized = normalizeMessages(messages);

    const result = streamText({
      model: groq('qwen-qwq-32b'),
      system: `Você é o Copiloto da PULSO CRM. Você é um assistente estratégico especializado em vendas B2B, análise de negócios e estruturação de projetos.
Seja direto, provocador (no bom sentido) e focado em gerar valor. Use formatação Markdown (negrito, listas) para tornar a leitura dinâmica.
Não use jargões difíceis à toa. Sempre que possível, seja conciso e foque no problema/solução.
Responda sempre em Português do Brasil.`,
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
