# Fase 10 — Notificações internas e Telegram Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar central interna persistente, alertas não bloqueantes e bot Telegram privado com comandos estruturados de consulta e escrita confirmada.

**Architecture:** Notificações são persistidas antes da tentativa externa. Um provider Telegram isolado encapsula Bot API e timeouts; webhook autenticado delega parsing e execução a serviços testáveis. Idempotência e confirmação de escrita são garantidas no PostgreSQL por operações atômicas.

**Tech Stack:** Next.js 16 App Router, TypeScript estrito, Drizzle/PostgreSQL, Telegram Bot API via `fetch`, Zod, Vitest e Playwright.

---

## Estrutura de arquivos

- Modify: `packages/database/src/schema.ts` — notificações, updates e ações pendentes.
- Create: `packages/database/drizzle/0009_*.sql` e meta — migração gerada após 0008.
- Modify: `packages/integrations/src/index.ts` — provider Telegram real e tipos const-first.
- Create: `apps/web/src/lib/notifications.ts` — persistência/delivery não bloqueante.
- Create: `apps/web/src/lib/telegram/config.ts`, `provider.ts`, `commands.ts`, `processor.ts` e testes focados. `provider.ts` no app é somente a factory que injeta configuração no provider HTTP real de `@pulso/integrations`; não duplica Bot API.
- Create: `apps/web/src/lib/today-data.ts` — serviço compartilhado por `/hoje` e Central de Hoje.
- Modify: quatro Server Actions de eventos — disparar notificações.
- Replace: `apps/web/src/app/(crm)/app/inteligencia/notificacoes/page.tsx`.
- Create: `apps/web/src/app/(crm)/app/inteligencia/notificacoes/actions.ts`.
- Modify: `apps/web/src/lib/nav.ts`, sidebar/central — contador não lido.
- Create: `apps/web/src/app/api/integrations/telegram/webhook/route.ts`.
- Replace: `apps/web/src/app/(crm)/app/configuracoes/integracoes/page.tsx`.
- Create: `apps/web/src/app/(crm)/app/configuracoes/integracoes/actions.ts`.
- Create: `apps/web/e2e/notificacoes.spec.ts`.
- Modify: docs de acompanhamento/operação ao fechar a fase.

## Pré-requisito de execução

Executar primeiro o plano `2026-07-20-fase-10-relatorios.md` até o checkpoint. `schema.ts`, migração 0008, snapshot e journal precisam estar sincronizados localmente e aplicados no banco de desenvolvimento. Se `_journal.json` ainda terminar em 0007, parar; não gerar a migração Telegram com numeração presumida nem renomear arquivos manualmente.

### Task 1: Criar persistência de notificação e Telegram

- [ ] **Step 1: adicionar objetos const e tabelas ao schema**

```ts
export const NOTIFICATION_TELEGRAM_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  DISABLED: "disabled",
  ERROR: "error",
} as const;
```

Tabelas: `admin_notifications`, `telegram_updates`, `telegram_pending_actions`, com índices/uniques definidos na spec e payload `$type<Record<string, unknown>>()` validado antes do uso.

- [ ] **Step 2: gerar/aplicar migração 0009 na VPS**

Antes, verificar que `_journal.json` contém 0008 e que o banco de desenvolvimento a aplicou. Run: `npm run db:generate && npm run db:migrate`

Expected: migração posterior à 0008, aplicada no banco de desenvolvimento.

- [ ] **Step 3: trazer migração/meta para o local e rodar typecheck**

Expected: PASS.

### Task 2: Provider Telegram real

- [ ] **Step 1: escrever testes de parsing de resposta/timeout sem simular dados do CRM**

Injetar função `fetch` tipada apenas no teste unitário do adapter; produção usa `globalThis.fetch`. O teste comprova contrato HTTP, não substitui a validação externa obrigatória.

- [ ] **Step 2: implementar configuração server-only**

Ler `TELEGRAM_ENABLED`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`, `BETTER_AUTH_URL`; retornar estado sanitizado e nunca os valores.

- [ ] **Step 3: implementar métodos**

`getMe`, `getWebhookInfo`, `setWebhook`, `sendMessage`, `answerCallbackQuery`. Usar `AbortController` e timeout curto. Erro contém apenas código/descrição sanitizada.

- [ ] **Step 4: manter interface pública em `@pulso/integrations`**

Não usar `any`; objetos aninhados recebem interfaces próprias; status vêm de objetos `as const`.

### Task 3: Central interna e delivery

- [ ] **Step 1: escrever teste de `eventKey` e truncamento**

Título ≤120, resumo ≤500, chave ≤180 no formato definido.

- [ ] **Step 2: implementar `notifyAdmin(input)`**

Insert com `onConflictDoNothing`, tentativa Telegram somente para nova notificação, atualização de status/message ID. Toda falha é capturada e registrada sem relançar para a ação de negócio.

- [ ] **Step 3: implementar consulta/leitura/reenvio**

Server Actions autenticadas para marcar uma/todas como lidas e reenviar falha; `securePath` é produzido por código, nunca aceito de formulário.

- [ ] **Step 4: substituir página preview**

Filtros todas/não lidas, estado vazio real, links e badges de delivery.

- [ ] **Step 5: adicionar contador não lido**

Consultar no layout/Sidebar sem depender do client; incluir a mesma contagem no DTO e em um card/link da Central de Hoje; garantir que mobile não quebre.

### Task 4: Conectar eventos obrigatórios

- [ ] **Step 1: condição alternativa de proposta**

Após persistir pedido, chamar `notifyAdmin` com `eventKey=proposal.alternative:<proposalId>:<requestId>`.

- [ ] **Step 2: alterações em aprovação**

No helper compartilhado, somente para `changes_requested` com `input.actor="anonymous"` (links público e portal). Decisão interna não notifica o próprio administrador. Usar chave com aprovação + timestamp/identificador estável da decisão.

- [ ] **Step 3: chamado aberto pelo portal**

Chave `ticket.created:<ticketId>:<ticketId>`.

- [ ] **Step 4: resposta do cliente**

Usar o ID retornado por `ticket_messages` como versão da chave.

- [ ] **Step 5: confirmar não bloqueio**

Com Telegram desabilitado, repetir E2E dos quatro fluxos; operações principais continuam concluindo e central recebe uma linha única.

### Task 5: Extrair serviço da Central de Hoje

- [ ] **Step 1: mover consultas para `today-data.ts`**

DTO plano com contagens e itens; página `/app/hoje` consome o mesmo serviço sem regressão visual. Reutilizar o helper temporal de relatórios para calcular início local inclusivo e fim exclusivo do dia em `America/Fortaleza`; não usar `toISOString().slice(0, 10)`. Consultar explicitamente, com limites curtos: tarefas vencidas e para hoje; todas as aprovações pendentes (destacando vencidas); financeiro empresarial vencido agregado; oportunidades abertas com próxima ação vencida ou para hoje; chamados com status `new`; e notificações administrativas não lidas.

- [ ] **Step 2: criar formatter seguro para Telegram**

Limitar cada categoria a três itens e o texto total ao limite seguro do Telegram; financeiro mostra apenas contagem/total agregado, nunca detalhes sensíveis. Informar quando há mais itens que os exibidos.

- [ ] **Step 3: testar `/hoje` em banco real pelo processor**

Expected: resposta contém métricas coerentes e URL autenticada quando aplicável.

### Task 6: Parser de comandos

- [ ] **Step 1: escrever testes falhando**

Cobrir `/ajuda`, `/hoje`, `/buscar`, `/tarefa`, `/nota`, `/cancelar`, comando desconhecido, limites de texto e data inválida.

- [ ] **Step 2: implementar discriminantes const-first e guards Zod**

```ts
export const TELEGRAM_COMMAND = {
  HELP: "help",
  TODAY: "today",
  SEARCH: "search",
  TASK: "task",
  NOTE: "note",
  CANCEL: "cancel",
} as const;
```

- [ ] **Step 3: datas Fortaleza**

Converter `DD/MM/AAAA HH:mm` explicitamente para instante; rejeitar datas inexistentes/ambíguas.

- [ ] **Step 4: rodar testes unitários**

Expected: PASS.

### Task 7: Processador idempotente e confirmações

- [ ] **Step 1: validar webhook antes de qualquer acesso ao banco**

O Route Handler compara em tempo constante `X-Telegram-Bot-Api-Secret-Token` antes de parsear o corpo, chamar o processor ou tocar no banco. Segredo inválido retorna 401 e não pode reservar/envenenar `update_id`.

- [ ] **Step 2: reservar `update_id` e autorizar chat**

Após segredo e corpo válidos, fazer insert único de `update_id`; conflito significa já processado e retorna 200 sem efeito. Validar `chatId` antes de qualquer consulta do CRM; chat diferente é ignorado/respondido genericamente.

- [ ] **Step 3: consultas `/hoje` e `/buscar`**

Busca empresas/projetos com termo ≥2, máximo 8, links Better Auth.

- [ ] **Step 4: criar ações pendentes para `/tarefa` e `/nota`**

Persistir payload validado, expiração 10min e botões inline com callback contendo somente UUID/decisão.

- [ ] **Step 5: confirmar/cancelar atomicamente**

Executar em uma única transação: `UPDATE ... WHERE confirmedAt IS NULL AND cancelledAt IS NULL AND expiresAt > now() RETURNING`, insert de tarefa/atividade e auditoria usando o mesmo executor transacional. Adaptar `recordAuditEvent` para aceitar opcionalmente executor Drizzle compatível, ou criar helper transacional equivalente que preserve o hash; nunca chamar o `db` global no meio da confirmação. Auditoria usa `actorType="system"`, `actorId="telegram:<chatId>"`, ação `telegram.task_created`/`telegram.note_created` e entidade real criada. Somente quem obtém a linha executa o efeito. `/cancelar` cancela todas pendentes do chat por update condicional.

- [ ] **Step 6: testar concorrência, expiração e cancelamento**

Disparar duas confirmações concorrentes para a mesma ação e verificar uma única tarefa/nota + auditoria; testar callback expirado e `/cancelar` sem efeitos.

- [ ] **Step 7: responder sucesso/erro sanitizado**

Notas usam `activities`; tarefas são gerais; nenhuma ação financeira.

### Task 8: Endpoint webhook

- [ ] **Step 1: criar route handler POST**

Validar primeiro o secret header sem tocar no banco; depois validar `content-type`, tamanho máximo e corpo Zod e chamar o processor. Responder rapidamente; processamento síncrono limitado aos comandos pequenos desta versão.

- [ ] **Step 2: testar header/chat/update duplicado**

Testes de integração no banco de desenvolvimento confirmam 401/200 e efeito único.

- [ ] **Step 3: garantir que GET/segredo inválido não exponham estado**

Expected: método não permitido ou resposta genérica.

### Task 9: Configuração real de integrações

- [ ] **Step 1: substituir cards estáticos por estados reais**

Telegram mostra desativado, não configurado, em teste, ativo ou com erro. “Em teste” é o estado local da Server Action enquanto executa `getMe`/webhook/mensagem, sem persistir segredo; após a resposta, renderiza ativo ou erro. Demais providers continuam honestamente como manual/desativado conforme env, sem inventar teste.

- [ ] **Step 2: ações administrativas**

`testTelegram`, `registerTelegramWebhook`, `sendTelegramTestMessage`, todas Better Auth + auditoria. URL deriva de config do servidor.

- [ ] **Step 3: mensagens seguras**

Mostrar nomes das variáveis ausentes, nunca valores parciais.

### Task 10: E2E da central

- [ ] **Step 1: criar eventos reais únicos**

Gerar condição alternativa, alterações em aprovação, chamado e resposta do portal.

- [ ] **Step 2: verificar central e deduplicação**

Contador, filtro não lidas, links, marcar uma/todas e uma linha por evento.

- [ ] **Step 3: verificar estado Telegram sem credenciais**

Tela continua funcional e informa configuração ausente; core não falha.

- [ ] **Step 4: rodar desktop e mobile**

Run: `PORT=3010 npx playwright test e2e/notificacoes.spec.ts`

Expected: PASS.

### Task 11: Validação externa do Telegram

- [ ] **Step 1: obter credenciais fora do Git**

Responsável fornece/configura bot token, chat ID e segredo no ambiente de desenvolvimento e depois no Dokploy.

- [ ] **Step 2: testar provider e registrar webhook**

`getMe`, `getWebhookInfo`, `setWebhook`, mensagem de teste. Expected: Bot API real confirma.

- [ ] **Step 3: testar comandos no chat autorizado**

Executar `/hoje`, `/buscar`, `/tarefa` + confirmar e `/nota` + confirmar; verificar registros no CRM e auditoria.

- [ ] **Step 4: testar segurança**

Update duplicado não duplica; ação expirada não executa; chat diferente não consulta dados.

### Task 12: Fechar a Fase 10

- [ ] **Step 1: suíte completa na VPS**

Run: `rm -rf apps/web/.next && npm run typecheck && npm run lint && npm run test && npm run build`

Run: `PORT=3010 npx playwright test`

Expected: tudo verde ou qualquer flake reproduzido/explicado com evidência, nunca ignorado.

- [ ] **Step 2: atualizar documentação**

Modificar `docs/progresso.md`, `docs/validacao.md`, `docs/decisoes-tecnicas.md` e `docs/operacao.md` com comandos, variáveis, webhook e resultados exatos.

- [ ] **Step 3: revisão final**

`git diff --check`, inspeção de secrets, migrações e status. Confirmar que bot token/chat ID/secret não estão no diff.

- [ ] **Step 4: commit e push únicos da fase**

```bash
git add apps/web packages/database packages/integrations docs
git commit -m "Fase 10: relatorios, notificacoes e Telegram completo"
git push origin master
```

- [ ] **Step 5: produção**

Acompanhar redeploy, health 200, executar `npm run db:migrate` no container novo e registrar webhook para a URL de produção somente após migração/health. Revalidar mensagem e `/hoje` no chat real.
