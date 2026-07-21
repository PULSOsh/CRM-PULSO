import { db, schema } from "@pulso/database";
import { eq, or, ilike, and, isNull, gt, desc } from "drizzle-orm";
import { parseTelegramCommand, TELEGRAM_COMMAND, ParsedCommand } from "./commands";
import { HttpTelegramProvider } from "@pulso/integrations";
import { getTodayData, formatTodayDataForTelegram } from "../today-data";
import { recordAuditEvent } from "@pulso/database/audit";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export async function processTelegramWebhook(
  secretToken: string | null,
  body: any,
  config: { token: string; chatId: string; webhookSecret: string }
) {
  // Step 1: Validar webhook apenas se secretToken for exigido
  if (secretToken && config.webhookSecret && secretToken !== config.webhookSecret) {
    return { status: 401, message: "Unauthorized" };
  }

  const updateId = body.update_id;
  if (typeof updateId !== "number") return { status: 400, message: "Invalid update_id" };

  // Step 2: Reservar update_id
  try {
    const inserted = await db.insert(schema.telegramUpdates)
      .values({ updateId })
      .onConflictDoNothing()
      .returning();
      
    if (inserted.length === 0) {
      return { status: 200, message: "Already processed" };
    }
  } catch (err) {
    return { status: 500, message: "Database error on update_id" };
  }

  // Se não tem message ou callback_query, ignora
  const message = body.message;
  const callbackQuery = body.callback_query;
  const telegram = new HttpTelegramProvider({ botToken: config.token });

  if (callbackQuery) {
    return await handleCallbackQuery(callbackQuery, config, telegram);
  }

  if (message) {
    const chatId = message.chat?.id?.toString();
    if (!chatId) return { status: 200, message: "Missing chatId" };
    if (config.chatId && config.chatId !== "*" && chatId !== config.chatId) {
      return { status: 200, message: "Ignored chat" };
    }

    const text = message.text;
    if (typeof text !== "string") return { status: 200, message: "Ignored non-text" };

    const command = parseTelegramCommand(text);
    return await executeCommand(command, chatId, telegram);
  }

  return { status: 200, message: "Ignored update type" };
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

async function askGeminiAboutCrm(userMessage: string): Promise<string> {
  try {
    const [recentOpps, recentProposals, recentContracts, recentLeads, recentProjects] = await Promise.all([
      db.select({ title: schema.opportunities.title, code: schema.opportunities.code, status: schema.opportunities.status, value: schema.opportunities.expectedValue })
        .from(schema.opportunities).orderBy(desc(schema.opportunities.createdAt)).limit(5),
      db.select({ code: schema.proposals.code, status: schema.proposals.status })
        .from(schema.proposals).orderBy(desc(schema.proposals.createdAt)).limit(5),
      db.select({ code: schema.contracts.code, status: schema.contracts.status })
        .from(schema.contracts).orderBy(desc(schema.contracts.createdAt)).limit(5),
      db.select({ name: schema.leads.name, status: schema.leads.status })
        .from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(5),
      db.select({ name: schema.projects.name, status: schema.projects.status })
        .from(schema.projects).orderBy(desc(schema.projects.createdAt)).limit(5),
    ]);

    const contextSnapshot = `
=== DADOS EM TEMPO REAL DO PULSO CRM ===
[Oportunidades no Funil]: ${recentOpps.map(o => `${o.code}: ${o.title} (R$ ${o.value})`).join(", ") || "Nenhuma"}
[Propostas Recentes]: ${recentProposals.map(p => `${p.code} (${p.status})`).join(", ") || "Nenhuma"}
[Contratos Recentes]: ${recentContracts.map(c => `${c.code} (${c.status})`).join(", ") || "Nenhum"}
[Leads Recentes]: ${recentLeads.map(l => `${l.name} (${l.status})`).join(", ") || "Nenhum"}
[Projetos Ativos]: ${recentProjects.map(pr => `${pr.name} (${pr.status})`).join(", ") || "Nenhum"}
`;

    const prompt = `Você é o Assistente Virtual Oficial do PULSO CRM no Telegram.
Responda de forma direta, clara, sem rodeios e com tom profissional da PULSO.

CONTEXTO DO BANCO DE DADOS EM TEMPO REAL:
${contextSnapshot}

PERGUNTA DO USUÁRIO NO TELEGRAM:
"${userMessage}"

Responda em texto simples em Português do Brasil (máximo 2 parágrafos).`;

    const { text } = await generateText({
      model: google("gemini-flash-latest"),
      prompt,
    });

    return text.trim();
  } catch (error) {
    console.error("Gemini Telegram Error:", error);
    return "Olá! Sou o assistente de IA do PULSO CRM. Posso ajudar com informações sobre oportunidades, propostas, contratos e estatísticas. Como posso te ajudar agora?";
  }
}

async function executeCommand(cmd: ParsedCommand, chatId: string, telegram: HttpTelegramProvider) {
  try {
    if (cmd.type === "unknown") {
      const geminiReply = await askGeminiAboutCrm(cmd.text);
      await telegram.sendMessage({ chat_id: chatId, text: geminiReply });
      return { status: 200, message: "Replied via Gemini AI" };
    }

    if (cmd.type === TELEGRAM_COMMAND.HELP) {
      const help = `*Comandos disponíveis:*\n\n/hoje - Resumo do dia e itens pendentes\n/buscar [termo] - Busca empresas e projetos\n/tarefa DD/MM/AAAA HH:mm [título] - Cria uma tarefa para o dia\n/nota [texto] - Adiciona uma nota rápida\n/cancelar - Cancela ações pendentes de confirmação`;
      await telegram.sendMessage({ chat_id: chatId, text: help, parse_mode: "MarkdownV2" });
      return { status: 200, message: "Replied help" };
    }

    if (cmd.type === TELEGRAM_COMMAND.TODAY) {
      const data = await getTodayData();
      const text = formatTodayDataForTelegram(data);
      await telegram.sendMessage({ chat_id: chatId, text, parse_mode: "MarkdownV2" });
      return { status: 200, message: "Replied today" };
    }

    if (cmd.type === TELEGRAM_COMMAND.SEARCH) {
      const projectsP = db.select().from(schema.projects).where(ilike(schema.projects.name, `%${cmd.term}%`)).limit(8);
      const companiesP = db.select().from(schema.companies).where(ilike(schema.companies.tradeName, `%${cmd.term}%`)).limit(8);
      const [projects, companies] = await Promise.all([projectsP, companiesP]);
      
      let text = `*Resultados para "${cmd.term}":*\n\n`;
      if (companies.length > 0) {
        text += `*Empresas:*\n` + companies.map(c => `• ${c.tradeName}`).join("\n") + "\n\n";
      }
      if (projects.length > 0) {
        text += `*Projetos:*\n` + projects.map(p => `• ${p.name}`).join("\n") + "\n\n";
      }
      if (companies.length === 0 && projects.length === 0) {
        text = `Nenhum resultado encontrado para "${cmd.term}".`;
      }
      
      // Sanitizar markdown básico
      text = text.replace(/([_\[\]()~`>#+\-=|{}.!])/g, "\\$1");
      await telegram.sendMessage({ chat_id: chatId, text, parse_mode: "MarkdownV2" });
      return { status: 200, message: "Replied search" };
    }

    if (cmd.type === TELEGRAM_COMMAND.TASK || cmd.type === TELEGRAM_COMMAND.NOTE) {
      // Criar ação pendente
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      
      const payload = cmd.type === TELEGRAM_COMMAND.TASK 
        ? { title: cmd.title, dueAt: cmd.dueAt.toISOString() }
        : { summary: cmd.summary };

      const [action] = await db.insert(schema.telegramPendingActions).values({
        chatId,
        command: cmd.type === TELEGRAM_COMMAND.TASK ? "create_task" : "create_note",
        payload,
        expiresAt
      }).returning();

      const text = cmd.type === TELEGRAM_COMMAND.TASK 
        ? `Confirma a criação da tarefa?\n\n*Título:* ${cmd.title}\n*Prazo:* ${cmd.dueAt.toLocaleString("pt-BR")}`
        : `Confirma a criação da nota?\n\n*Nota:* ${cmd.summary}`;

      await telegram.sendMessage({
        chat_id: chatId,
        text: text.replace(/([_\[\]()~`>#+\-=|{}.!])/g, "\\$1"),
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Confirmar", callback_data: `confirm:${action.id}` },
              { text: "❌ Cancelar", callback_data: `cancel:${action.id}` }
            ]
          ]
        }
      });
      return { status: 200, message: "Created pending action" };
    }

    if (cmd.type === TELEGRAM_COMMAND.CANCEL) {
      await db.update(schema.telegramPendingActions)
        .set({ cancelledAt: new Date() })
        .where(
          and(
            eq(schema.telegramPendingActions.chatId, chatId),
            isNull(schema.telegramPendingActions.confirmedAt),
            isNull(schema.telegramPendingActions.cancelledAt)
          )
        );
      
      await telegram.sendMessage({ chat_id: chatId, text: "Ações pendentes canceladas." });
      return { status: 200, message: "Cancelled pending actions" };
    }
  } catch (err) {
    console.error("Error executing command", err);
    await telegram.sendMessage({ chat_id: chatId, text: "Ocorreu um erro ao processar o comando." });
  }

  return { status: 200, message: "Executed command with generic catch" };
}

async function handleCallbackQuery(callbackQuery: any, config: { token: string; chatId: string; webhookSecret: string }, telegram: HttpTelegramProvider) {
  const chatId = callbackQuery.message?.chat?.id?.toString();
  if (!chatId) return { status: 200, message: "Missing callback chatId" };
  if (config.chatId && config.chatId !== "*" && chatId !== config.chatId) {
    return { status: 200, message: "Ignored callback chat" };
  }

  const data = callbackQuery.data;
  if (typeof data !== "string") return { status: 200, message: "Ignored non-string callback" };

  const [actionStr, actionId] = data.split(":");
  
  if (actionStr === "cancel") {
    await db.update(schema.telegramPendingActions)
      .set({ cancelledAt: new Date() })
      .where(
        and(
          eq(schema.telegramPendingActions.id, actionId),
          isNull(schema.telegramPendingActions.confirmedAt),
          isNull(schema.telegramPendingActions.cancelledAt)
        )
      );
    await telegram.sendMessage({ chat_id: chatId, text: "Ação cancelada." });
    await telegram.answerCallbackQuery({ callback_query_id: callbackQuery.id, text: "Cancelado" });
    return { status: 200, message: "Cancelled action" };
  }

  if (actionStr === "confirm") {
    // Transação manual: atualiza returning e insere se retornar 1 linha
    const updated = await db.update(schema.telegramPendingActions)
      .set({ confirmedAt: new Date() })
      .where(
        and(
          eq(schema.telegramPendingActions.id, actionId),
          isNull(schema.telegramPendingActions.confirmedAt),
          isNull(schema.telegramPendingActions.cancelledAt),
          gt(schema.telegramPendingActions.expiresAt, new Date())
        )
      ).returning();

    if (updated.length === 0) {
      await telegram.sendMessage({ chat_id: chatId, text: "Ação expirada, já confirmada ou cancelada." });
      await telegram.answerCallbackQuery({ callback_query_id: callbackQuery.id, text: "Ação inválida" });
      return { status: 200, message: "Action invalid or expired" };
    }

    const pending = updated[0];

    try {
      if (pending.command === "create_task") {
        const payload = pending.payload as { title: string; dueAt: string };
        const [task] = await db.insert(schema.tasks).values({
          title: payload.title,
          status: "todo",
          dueAt: new Date(payload.dueAt),
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();

        await recordAuditEvent({
          actorType: "system",
          actorId: `telegram:${chatId}`,
          action: "telegram.task_created",
          entityType: "task",
          entityId: task.id
        });

        await telegram.sendMessage({ chat_id: chatId, text: "Tarefa criada com sucesso!" });
      } else if (pending.command === "create_note") {
        const payload = pending.payload as { summary: string };
        const [activity] = await db.insert(schema.activities).values({
          type: "note",
          summary: payload.summary,
          createdBy: "system",
          entityType: "system",
          entityId: "00000000-0000-0000-0000-000000000000"
        }).returning();

        await recordAuditEvent({
          actorType: "system",
          actorId: `telegram:${chatId}`,
          action: "telegram.note_created",
          entityType: "activity",
          entityId: activity.id
        });

        await telegram.sendMessage({ chat_id: chatId, text: "Nota criada com sucesso!" });
      }

      await telegram.answerCallbackQuery({ callback_query_id: callbackQuery.id, text: "Confirmado!" });
    } catch (err) {
      console.error("Error creating task/note", err);
      await telegram.sendMessage({ chat_id: chatId, text: "Erro ao criar no banco de dados." });
    }
  }

  return { status: 200, message: "Processed callback" };
}
}
