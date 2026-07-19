import "dotenv/config";
import { db, pool } from "./index";
import { pipelineStages, pipelines, products } from "./schema";

const mainStages = [
  "Novo lead",
  "Primeiro contato",
  "Qualificação",
  "Briefing solicitado",
  "Briefing recebido",
  "Diagnóstico",
  "Proposta em preparação",
  "Proposta enviada",
  "Negociação",
  "Fechado — ganho",
  "Fechado — perdido",
];

const catalog = [
  ["PROD-001", "Link na Bio", "Presença digital", "197"],
  ["PROD-002", "Cartão Digital", "Presença digital", "297"],
  ["PROD-003", "Catálogo Digital", "Presença digital", "597"],
  ["PROD-004", "Site Essencial", "Sites", "1200"],
  ["PROD-005", "Landing Page", "Sites", "1500"],
  ["PROD-006", "Site Institucional", "Sites", "2500"],
  ["PROD-007", "Loja Virtual", "Sites", "3500"],
  ["PROD-008", "Site Profissional para Dentistas", "Sites", "1500"],
  ["PROD-009", "Integração com IA", "Automação e IA", "2000"],
  ["PROD-010", "Automação de Processos", "Automação e IA", "3000"],
  ["PROD-011", "Sistema Web", "Sistemas", "4500"],
  ["PROD-012", "CRM/Painel Operacional", "Sistemas", "5000"],
];

async function seed() {
  const [pipeline] = await db
    .insert(pipelines)
    .values({ name: "Pipeline comercial principal", kind: "sales", isDefault: true })
    .onConflictDoNothing()
    .returning();

  if (pipeline) {
    await db.insert(pipelineStages).values(
      mainStages.map((name, position) => ({
        pipelineId: pipeline.id,
        name,
        position,
        defaultProbability: Math.min(position * 10, 100),
      })),
    );
  }

  await db
    .insert(products)
    .values(
      catalog.map(([code, name, category, basePrice]) => ({
        code,
        name,
        category,
        basePrice,
      })),
    )
    .onConflictDoNothing();

  console.log("Seed concluído.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => pool.end());
