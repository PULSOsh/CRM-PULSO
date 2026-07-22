import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export type ProposalDraft = {
  intro: string;
  context: string;
  scopeTitle: string;
  scopeItems: Array<{
    name: string;
    description: string;
    price: number;
  }>;
};

export type ProductCatalogItem = {
  code: string;
  name: string;
  category: string;
  basePrice: number;
};

export async function generateProposalDraftFromBriefing(
  briefingData: string,
  catalog: ProductCatalogItem[] = []
): Promise<ProposalDraft> {
  const catalogText = catalog.length > 0
    ? catalog.map(p => `• ${p.name} (${p.code}) — Preço Fixo R$ ${p.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`).join("\n")
    : "Nenhum produto cadastrado no catálogo.";

  const prompt = `Você é o estrategista comercial sênior da PULSO (tecnologia, design e estratégia digital).
Sua missão é analisar o briefing do cliente e gerar o rascunho de uma proposta comercial altamente personalizada, com escopo cirúrgico e precificação RIGOROSAMENTE FIEL ao catálogo de produtos da PULSO.

REGRAS DE PRECIFICAÇÃO E ESCOPO (OBRIGATÓRIO):
1. VOCÊ DEVE USAR OS PREÇOS EXATOS DO CATÁLOGO DA PULSO para cada serviço principal selecionado (ex: se o cliente precisa de uma Landing Page, o valor DEVE ser R$ 1.500,00; se for Cartão Digital, R$ 297,00; Site Institucional, R$ 2.500,00). NUNCA INVENTE OU INFLA VALORES ALEATÓRIOS!
2. Caso o briefing solicite requisitos adicionais fora do catálogo padrão, adicione-os como itens de escopo complementar com valores realistas e transparentes.
3. No campo "context", resuma em 2 a 3 frases a dor exata do cliente e a solução proposta pela PULSO.
4. TOM DE VOZ PULSO: Direto, provocador, profissional, sem jargões genéricos de marketing ("transformação digital", "soluções inovadoras", etc).

CATÁLOGO OFICIAL DE PRODUTOS E PREÇOS DA PULSO:
${catalogText}

VOCÊ DEVE RESPONDER ÚNICA E EXCLUSIVAMENTE COM UM OBJETO JSON VÁLIDO no formato:
{
  "intro": "Apresentação direta e transparente do projeto.",
  "context": "Entendimento profundo da dor do cliente e objetivo da solução.",
  "scopeTitle": "Título da seção de entregáveis (ex: Escopo Técnico e Entregáveis)",
  "scopeItems": [
    {
      "name": "Nome do produto ou entregável",
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
    const parsed = JSON.parse(cleanText);
    return {
      intro: parsed.intro || "Proposta comercial personalizada PULSO.",
      context: parsed.context || "Resumo do projeto e entregáveis.",
      scopeTitle: parsed.scopeTitle || "Escopo do Projeto",
      scopeItems: Array.isArray(parsed.scopeItems) ? parsed.scopeItems.map((item: any) => ({
        name: String(item.name || "Serviço"),
        description: String(item.description || ""),
        price: Number(item.price) || 1500
      })) : []
    };
  } catch (error) {
    console.warn("Primary Gemini model failed for proposal draft, retrying...", error);
    try {
      const { text: fallbackText } = await generateText({
        model: google("gemini-flash-latest"),
        prompt,
      });
      const cleanFallback = fallbackText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanFallback);
      return {
        intro: parsed.intro || "Proposta comercial personalizada PULSO.",
        context: parsed.context || "Resumo do projeto e entregáveis.",
        scopeTitle: parsed.scopeTitle || "Escopo do Projeto",
        scopeItems: Array.isArray(parsed.scopeItems) ? parsed.scopeItems.map((item: any) => ({
          name: String(item.name || "Serviço"),
          description: String(item.description || ""),
          price: Number(item.price) || 1500
        })) : []
      };
    } catch (e) {
      // Direct Fallback based on catalog
      return {
        intro: "Proposta comercial elaborada pela equipe PULSO.",
        context: "Desenvolvimento técnico e design estratégico focado nos objetivos do cliente.",
        scopeTitle: "Escopo Técnico do Projeto",
        scopeItems: catalog.length > 0 
          ? [{ name: catalog[0].name, description: "Desenvolvimento e entrega do projeto.", price: catalog[0].basePrice }]
          : [{ name: "Landing Page", description: "Desenvolvimento de landing page de alta conversão.", price: 1500 }]
      };
    }
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

DADOS DA PROPOSTA:
${proposalData}`;

  try {
    const { text } = await generateText({
      model: google("gemini-flash-latest"),
      prompt,
    });
    return text;
  } catch (error) {
    console.error("Gemini Contract Generation Error:", error);
    return `### CLÁUSULA 1ª — DO OBJETO\nPrestação de serviços de tecnologia e design conforme proposta ${contractCode}.\n\n### CLÁUSULA 2ª — DOS VALORES\nValores e condições conforme aprovado na proposta comercial.`;
  }
}
