import { z } from "zod";

export const TELEGRAM_COMMAND = {
  HELP: "help",
  TODAY: "today",
  SEARCH: "search",
  TASK: "task",
  NOTE: "note",
  CANCEL: "cancel",
} as const;

export type TelegramCommandType = typeof TELEGRAM_COMMAND[keyof typeof TELEGRAM_COMMAND];

export type ParsedCommand = 
  | { type: typeof TELEGRAM_COMMAND.HELP }
  | { type: typeof TELEGRAM_COMMAND.TODAY }
  | { type: typeof TELEGRAM_COMMAND.SEARCH; term: string }
  | { type: typeof TELEGRAM_COMMAND.TASK; dueAt: Date; title: string }
  | { type: typeof TELEGRAM_COMMAND.NOTE; summary: string }
  | { type: typeof TELEGRAM_COMMAND.CANCEL }
  | { type: "unknown"; text: string };

function parseDateFortaleza(dateStr: string, timeStr: string): Date | null {
  // Expected format: DD/MM/YYYY HH:mm
  const [day, month, year] = dateStr.split("/").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  
  if (!day || !month || !year || isNaN(hour) || isNaN(minute)) return null;
  if (year < 2000 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  // Criar data no fuso de Fortaleza (UTC-3)
  // Para converter para UTC, subtraímos do UTC ou adicionamos as horas de offset.
  // Fortaleza não tem mais horário de verão. É sempre UTC-3.
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour + 3, minute));
  
  if (isNaN(utcDate.getTime())) return null;
  return utcDate;
}

export function parseTelegramCommand(text: string): ParsedCommand {
  const trimmed = text.trim();
  
  if (trimmed === "/ajuda") return { type: TELEGRAM_COMMAND.HELP };
  if (trimmed === "/hoje") return { type: TELEGRAM_COMMAND.TODAY };
  if (trimmed === "/cancelar") return { type: TELEGRAM_COMMAND.CANCEL };

  if (trimmed.startsWith("/buscar ")) {
    const term = trimmed.replace("/buscar ", "").trim();
    if (term.length < 2) return { type: "unknown", text: "Termo de busca muito curto (mínimo 2 caracteres)." };
    return { type: TELEGRAM_COMMAND.SEARCH, term };
  }

  if (trimmed.startsWith("/nota ")) {
    const summary = trimmed.replace("/nota ", "").trim();
    if (summary.length < 2) return { type: "unknown", text: "A nota precisa de conteúdo." };
    if (summary.length > 1000) return { type: "unknown", text: "Nota muito longa (máximo 1000 caracteres)." };
    return { type: TELEGRAM_COMMAND.NOTE, summary };
  }

  if (trimmed.startsWith("/tarefa ")) {
    const args = trimmed.replace("/tarefa ", "").trim();
    // match: DD/MM/YYYY HH:mm Texto da tarefa...
    const match = args.match(/^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s+(.+)$/);
    if (!match) return { type: "unknown", text: "Formato inválido. Use: /tarefa DD/MM/AAAA HH:mm Título da tarefa" };
    
    const [, dateStr, timeStr, title] = match;
    const dueAt = parseDateFortaleza(dateStr, timeStr);
    
    if (!dueAt) return { type: "unknown", text: "Data ou hora inválida." };
    if (title.length < 2 || title.length > 255) return { type: "unknown", text: "O título da tarefa deve ter entre 2 e 255 caracteres." };

    return { type: TELEGRAM_COMMAND.TASK, dueAt, title: title.trim() };
  }

  return { type: "unknown", text: "Comando desconhecido. Digite /ajuda para ver as opções." };
}
