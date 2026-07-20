# Fase 10 — Relatórios e exportações Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar relatórios comerciais, operacionais e financeiros calculados do PostgreSQL, com períodos consistentes e exportações CSV autenticadas.

**Architecture:** Regras de período, agregações e CSV vivem em módulos server-only independentes da interface. A página e a rota de exportação consomem a mesma camada de consulta para impedir divergência. O schema recebe somente timestamps necessários para métricas reais de fechamento/resolução.

**Tech Stack:** Next.js 16 App Router, TypeScript estrito, Drizzle/PostgreSQL, Zod, Vitest e Playwright.

---

## Estrutura de arquivos

- Modify: `packages/database/src/schema.ts` — timestamps de fechamento/resolução e índices.
- Create: `packages/database/drizzle/0008_*.sql` e snapshot/meta — migração gerada pelo Drizzle na VPS.
- Modify: `apps/web/src/app/(crm)/app/comercial/oportunidades/actions.ts` — preencher `closedAt`.
- Modify: `apps/web/src/app/(crm)/app/operacao/suporte/actions.ts` — manter ciclo de resolução.
- Modify: `apps/web/src/app/(public)/portal/actions.ts` — inicializar ciclo na criação e reiniciar quando cliente reabre chamado.
- Create: `apps/web/src/lib/reports/constants.ts` — objetos const e tipos derivados.
- Create: `apps/web/src/lib/reports/period.ts` e `period.test.ts` — limites no fuso Fortaleza.
- Create: `apps/web/src/lib/reports/queries.ts` — consultas e DTOs planos.
- Create: `apps/web/src/lib/reports/csv.ts` e `csv.test.ts` — CSV seguro.
- Create: `apps/web/src/app/api/reports/export/route.ts` — download autenticado.
- Replace: `apps/web/src/app/(crm)/app/inteligencia/relatorios/page.tsx` — UI real.
- Create: `apps/web/e2e/relatorios.spec.ts` — validação real.

### Task 1: Expandir timestamps de domínio

- [ ] **Step 1: adicionar campos ao schema**

```ts
export const opportunities = pgTable("opportunities", {
  // campos existentes
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const tickets = pgTable("tickets", {
  // campos existentes
  resolutionStartedAt: timestamp("resolution_started_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});
```

Adicionar índices nos timestamps usados pelos relatórios.

- [ ] **Step 2: sincronizar somente `schema.ts` para a VPS e gerar a migração**

Run: `npm run db:generate && npm run db:migrate`

Expected: nova migração 0008 aplicada no banco `pulso_crm`, sem alterar dados legados.

- [ ] **Step 3: copiar migração e metadados da VPS para o repositório local**

Expected: `packages/database/drizzle/0008_*.sql`, snapshot e `_journal.json` consistentes.

- [ ] **Step 4: verificar schema**

Run: `npm run typecheck`

Expected: PASS.

### Task 2: Manter datas de fechamento reais

- [ ] **Step 1: criar testes E2E que dependam das novas datas**

Em `relatorios.spec.ts`, preparar oportunidade ganha e chamado resolvido/reaberto; a primeira execução deve falhar porque relatórios ainda não existem.

- [ ] **Step 2: atualizar oportunidades**

Em `markOpportunityWon` e `markOpportunityLost`, incluir `closedAt: new Date()`. Não criar backfill para registros antigos.

- [ ] **Step 3: atualizar criação de chamados internos e do portal**

Tanto `createTicketInternally` quanto `createTicketFromPortal` devem inserir `resolutionStartedAt: new Date()` e `resolvedAt: null`; nenhum canal de abertura pode ficar fora do ciclo. Depois, em `updateTicketStatus`, calcular:

```ts
const TERMINAL_TICKET_STATUS = { RESOLVED: "resolved", CLOSED: "closed" } as const;
const OPEN_TICKET_STATUS = { NEW: "new", IN_PROGRESS: "in_progress", WAITING_CUSTOMER: "waiting_customer" } as const;
```

- entrada em terminal: preservar `resolutionStartedAt` existente ou iniciar agora, definir `resolvedAt` se ainda nulo;
- `resolved` → `closed`: preservar ambas;
- terminal → aberto: `resolutionStartedAt=now`, `resolvedAt=null`.

- [ ] **Step 4: atualizar reabertura pelo portal**

Quando resposta do cliente reabrir chamado terminal, definir `status="new"`, `resolutionStartedAt=now` e `resolvedAt=null`.

- [ ] **Step 5: executar typecheck e o trecho E2E de preparação**

Expected: timestamps persistidos sem quebrar suporte/oportunidades.

### Task 3: Implementar períodos determinísticos

- [ ] **Step 1: escrever testes unitários falhando**

Cobrir `30d`, `90d`, `year`, `all`, valor inválido, virada de ano e limites locais inclusivo/exclusivo.

- [ ] **Step 2: criar constantes e tipos pelo padrão const-first**

```ts
export const REPORT_PERIOD = {
  THIRTY_DAYS: "30d",
  NINETY_DAYS: "90d",
  YEAR: "year",
  ALL: "all",
} as const;
export type ReportPeriod = (typeof REPORT_PERIOD)[keyof typeof REPORT_PERIOD];
```

- [ ] **Step 3: implementar `resolveReportPeriod`**

Usar `Intl.DateTimeFormat`/helpers explícitos para `America/Fortaleza`; não depender do timezone da VPS. Retornar DTO plano com `start`, `end`, `startDate`, `endDate`.

- [ ] **Step 4: rodar teste**

Run: `npm run test -- period.test.ts`

Expected: PASS.

### Task 4: Consultas reais de relatório

- [ ] **Step 1: definir DTOs planos**

Interfaces aninhadas devem ser separadas. Não usar `any` nem unions literais diretas; tipos de status existentes vêm do schema e tipos novos vêm de objetos `as const`.

- [ ] **Step 2: implementar `getCommercialReport(period)`**

Consultas agregadas e linhas de exportação para leads/oportunidades. Taxas retornam `number | null` quando não há denominador. Valor e quantidade do pipeline aberto são fotografia atual e ignoram o período; ganhos/perdas usam `closedAt` no período e aquisições usam `createdAt`. Construir linhas de oportunidades em `Map<id, row>` para que uma oportunidade criada e fechada no mesmo intervalo apareça uma única vez, com `criado_em` e `fechado_em` preenchidos.

- [ ] **Step 3: implementar `getOperationsReport(period)`**

Separar snapshots atuais (projetos/aprovações pendentes) dos fluxos do período. Horas usam `startedAt`; somar `durationMinutes` do período e comparar com `estimatedHours` dos projetos distintos relacionados a essas horas, sem multiplicar a estimativa por lançamento. Resolução usa `resolvedAt - resolutionStartedAt` apenas quando ambos existem; média retorna `number | null` quando não há ciclo válido. Construir explicitamente as linhas exportáveis: `projeto_criado` por `projects.createdAt`; `aprovacao_decidida` por `decidedAt`; `aprovacao_pendente_atual` sem data; `horas_registradas` por `startedAt`; `chamado_criado` por `createdAt`; e `chamado_resolvido` por `resolvedAt`. Um chamado criado e resolvido no intervalo produz duas linhas distintas.

- [ ] **Step 4: implementar `getFinancialReport(period)`**

Aplicar sempre `scope="company"`. Previsto usa vencimento; realizado usa pagamento; usar conjunto/ID para não duplicar linhas exportadas que satisfaçam ambos. Total vencido ainda não quitado é fotografia atual independente do período, usa `dueDate < hoje local` + status não terminal e soma somente o saldo residual `amountExpected - amountActual` (nunca o valor esperado inteiro de um lançamento parcial).

- [ ] **Step 5: validar diretamente contra o banco de desenvolvimento**

Comparar pelo menos uma soma de cada bloco com SQL/Drizzle independente. Expected: mesmos valores.

- [ ] **Step 6: testar taxas sem denominador**

Teste unitário do helper de taxa retorna `null` para denominador zero e valor decimal correto nos demais casos.

### Task 5: CSV seguro e autenticado

- [ ] **Step 1: escrever testes falhando para serialização**

Cobrir BOM, `;`, vírgula decimal, aspas, quebras de linha, apóstrofo contra `= + - @` e cabeçalhos dos três tipos.

- [ ] **Step 2: implementar serializadores por tipo**

```ts
const FORMULA_PREFIXES = ["=", "+", "-", "@"] as const;
function sanitizeCsvCell(value: string): string {
  const safe = FORMULA_PREFIXES.some((prefix) => value.startsWith(prefix)) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
```

- [ ] **Step 3: criar rota `GET /api/reports/export`**

Autenticar com Better Auth, validar `report`/`period` com Zod, consultar serviço, registrar `report.exported` com `actorType="user"`, `actorId=session.user.id`, `entityType="report"`, `entityId=report` e `after: { report, period }`, e responder `text/csv; charset=utf-8` + attachment.

- [ ] **Step 4: testar 401, 400 e download válido**

Expected: sem sessão 401; parâmetros inválidos 400; sessão válida baixa CSV.

### Task 6: Construir a interface de relatórios

- [ ] **Step 1: substituir o preview**

Server Component lê período, valida sem lançar e recua explicitamente para `30d` se o parâmetro for inválido. Depois chama os três relatórios em paralelo e renderiza seletor com links. A rota API mantém 400 para o mesmo valor inválido.

- [ ] **Step 2: renderizar comercial**

Cards para pipeline/ganhos/taxas, listas por status/origem e CTA de CSV. “Sem dados” para taxas nulas.

- [ ] **Step 3: renderizar operacional**

Separar visualmente “Fotografia atual” de “Movimento no período”; mostrar projetos, aprovações, horas estimadas×realizadas e suporte. Média nula aparece como “Sem dados”, nunca zero.

- [ ] **Step 4: renderizar financeiro**

Previsto, realizado, vencido e resultado; usar `money-value` para respeitar ocultação de valores existente.

- [ ] **Step 5: explicar bases temporais**

Cada bloco mostra texto curto com a base: criação (`createdAt`), fechamento (`closedAt`), decisão (`decidedAt`), horas (`startedAt`), resolução (`resolvedAt`), previsto (`dueDate`) e realizado (`paidAt`). Snapshots atuais são rotulados como independentes do período.

- [ ] **Step 6: verificar responsividade e acessibilidade**

Sem overflow em Pixel 7; links de período e exportação com nomes acessíveis; tabelas têm cabeçalhos.

### Task 7: E2E de relatórios

- [ ] **Step 1: finalizar preparação única de dados**

Usar sufixos `Date.now()`; criar lead/oportunidade, projeto/horas/aprovação/chamado e lançamentos empresarial+pessoal reais.

- [ ] **Step 2: verificar os três painéis**

Asserções devem usar os valores dos registros criados, não totais globais frágeis do banco compartilhado.

- [ ] **Step 3: verificar CSV**

Baixar, ler texto e confirmar registro empresarial e ausência do pessoal.

- [ ] **Step 4: rodar desktop e mobile**

Run: `PORT=3010 npx playwright test e2e/relatorios.spec.ts`

Expected: PASS em chromium e mobile.

### Task 8: Checkpoint sem commit

- [ ] **Step 1: rodar checks do subsistema**

Run: `rm -rf apps/web/.next && npm run typecheck && npm run lint && npm run test && npm run build`

Expected: 0 erros; somente avisos preexistentes documentados.

- [ ] **Step 2: revisar diff e `git diff --check`**

- [ ] **Step 3: não commitar ainda**

A regra do projeto exige que relatórios e notificações/Telegram sejam validados juntos antes do único commit/push da Fase 10.
