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
  const prompt = `Você é o departamento jurídico da PULSO (tecnologia, design e estratégia digital).
Sua missão é gerar um INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS juridicamente perfeito, direto, transparente e sem clichês ou robotismos de IA.

DIRETRIZES DE ESTILO E REDAÇÃO (TOM DE VOZ PULSO):
- Linguagem formal, técnica, límpida e direta.
- EVITE frases vazias de IA como "Em testemunho do que", "O presente instrumento visa estabelecer", "Sendo assim", "Sem mais delongas".
- Escreva cláusulas numeradas e organizadas por tópicos em Markdown.

ESTRUTURA OBRIGATÓRIA DO CONTRATO:

### CLÁUSULA 1ª — DO OBJETO E ESCOPO TÉCNICO
Descreva em detalhes cada um dos serviços e entregáveis incluídos na proposta aceita, sem omitir nenhum item do escopo.

### CLÁUSULA 2ª — DOS VALORES E CONDIÇÕES DE PAGAMENTO
Especifique o valor total exato (R$), as condições de parcelamento aceitas e as regras de liquidação. Em caso de atraso no pagamento de qualquer parcela, incidirá multa moratória de 2% (dois por cento) sobre o valor devido, acrescida de juros de mora de 1% (um por cento) ao mês.

### CLÁUSULA 3ª — DAS OBRIGAÇÕES DAS PARTES
- Obrigações da CONTRATADA (PULSO): Executar os serviços dentro dos padrões técnicos de excelência e prestar suporte referente aos entregáveis previstos.
- Obrigações do CONTRATANTE: Fornecer tempestivamente as informações, conteúdos, acessos e validações necessárias para o andamento do projeto.

### CLÁUSULA 4ª — DOS PRAZOS E CRONOGRAMA
Os prazos de execução terão início a partir do envio de todos os insumos necessários pelo CONTRATANTE e da confirmação do pagamento inicial.

### CLÁUSULA 5ª — DA PROPRIEDADE INTELECTUAL E DIREITOS AUTORAIS
Após a quitação integral dos valores estipulados neste contrato, a CONTRATADA cede ao CONTRATANTE todos os direitos patrimoniais sobre os entregáveis finais desenvolvidos especificamente para este projeto. A CONTRATADA reserva-se o direito de incluir o projeto em seu portfólio de cases.

### CLÁUSULA 6ª — DA RESCISÃO E CANCELAMENTO
Qualquer das partes poderá rescindir o presente contrato mediante comunicação formal por escrito com antecedência mínima de 15 (quinze) dias. Em caso de rescisão antecipada pelo CONTRATANTE sem justa causa, os valores referentes às etapas já executadas serão devidos e retidos proporcionalmente.

### CLÁUSULA 7ª — DO FORO DE ELEIÇÃO
Para dirimir quaisquer controvérsias oriundas deste contrato, as partes elegem o Foro da Comarca de Fortaleza, Estado do Ceará, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

CÓDIGO DO CONTRATO: ${contractCode}

DADOS DA PROPOSTA ACEITA:
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
