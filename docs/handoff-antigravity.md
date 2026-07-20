# Handoff para o Antigravity — PULSO CRM

Atualizado em 20/07/2026. Este documento descreve o estado exato deixado pelo Codex e deve ser lido antes de continuar o desenvolvimento.

## 1. Objetivo geral

Continuar o PULSO CRM com implementação real, TypeScript estrito, PostgreSQL/Drizzle e E2E Playwright reais na VPS. Não usar mocks para substituir fluxos do produto. Cada fase só pode receber commit e push depois de typecheck, lint, testes unitários, build, E2E focado e suíte completa.

O usuário definiu também que o Telegram será um canal privado bidirecional de aviso e comunicação administrativa com o CRM.

## 2. Estado Git e ambientes

- Repositório local: `D:\PULSO\PULSO_CRM_NOVA_BASE\pulso-crm`.
- Branch atual: `codex/fase-10`.
- HEAD/base: `fb0385e`.
- `master` e `origin/master` também apontam para `fb0385e`.
- Produção: `https://crm.pulsosh.cloud`.
- VPS de desenvolvimento: `pulso@191.96.251.124`, diretório `~/pulso-crm-app`, porta do app de teste `3010`.
- Banco de desenvolvimento: `pulso_crm`.
- Banco de produção: `pulsodb`.
- Chave SSH no Windows: `$env:USERPROFILE\.ssh\pulso_vps`. Usar PowerShell para `ssh/scp`; o SSH tem timeouts transitórios já conhecidos.
- O push em `origin/master` dispara redeploy automático pelo Dokploy. Isso é intencional.

Não há commit da Fase 10. Preserve integralmente o working tree atual.

## 3. Fase 9 — concluída e publicada

A Fase 9, portal do cliente e suporte, foi fechada antes de iniciar a Fase 10.

- `portal.spec.ts`: 21/21 testes passaram em desktop e mobile.
- Suíte completa: 99 passaram; houve um flake legado do financeiro mobile e três skips seriais decorrentes. O financeiro mobile isolado passou 6/6.
- Typecheck, lint, Vitest e build passaram.
- Durante a revisão foram corrigidas lacunas reais de autorização:
  - aprovação passou a validar a relação com o projeto;
  - chamado passou a validar permissão do projeto;
  - e-mail do portal passou a ser normalizado/rejeitado globalmente.
- `docs/progresso.md`, `docs/validacao.md` e `docs/decisoes-tecnicas.md` foram atualizados.
- Commit publicado: `fb0385e Fase 9: portal do cliente e suporte completo`.
- Deploy do Dokploy ficou saudável e `/api/health` respondeu 200.
- Migração `0007` aplicada em produção no banco `pulsodb`.

## 4. Fase 10 — decisões e documentação já produzidas

Foram escritos e revisados os seguintes documentos, ainda não commitados:

- `docs/superpowers/specs/2026-07-20-fase-10-relatorios-design.md`;
- `docs/superpowers/specs/2026-07-20-fase-10-notificacoes-telegram-design.md`;
- `docs/superpowers/plans/2026-07-20-fase-10-relatorios.md`;
- `docs/superpowers/plans/2026-07-20-fase-10-notificacoes-telegram.md`.

Os planos passaram por revisão independente. O andamento detalhado por tarefa está em `.superpowers/sdd/progress.md`; briefs, diffs e relatórios de revisão estão em `.superpowers/sdd/` e são deliberadamente ignorados pelo Git.

Política definida pelo usuário: nenhum commit intermediário. Relatórios e notificações/Telegram devem ser validados juntos e publicados em um único commit da Fase 10.

## 5. Relatórios — implementação existente no working tree

### Task 1 — schema e migração 0008: concluída e aprovada

- `opportunities.closedAt` e índice.
- `tickets.resolutionStartedAt`, `tickets.resolvedAt` e índices.
- Migração `packages/database/drizzle/0008_giant_khan.sql` e metadados Drizzle.
- Migração 0008 aplicada somente no banco de desenvolvimento.
- Typecheck passou.

### Task 2 — timestamps reais de domínio: concluída e aprovada

- Oportunidades ganhas/perdidas gravam `closedAt`.
- Chamados internos e do portal iniciam ciclo de resolução.
- Resolver/fechar preserva timestamps; reabrir inicia novo ciclo e limpa `resolvedAt`.
- Resposta do cliente reabre chamado terminal.
- Corrigido o formulário do portal sem projeto: `projectId` aceita `null` do `FormData`.
- E2E anterior passou em Chromium e mobile, incluindo portal real.

### Task 3 — períodos Fortaleza: concluída e aprovada

- `apps/web/src/lib/reports/constants.ts`.
- `apps/web/src/lib/reports/period.ts`.
- `apps/web/src/lib/reports/period.test.ts`.
- Períodos `30d`, `90d`, `year`, `all`, sempre em `America/Fortaleza`, com fronteiras determinísticas.
- Vitest 7/7 e typecheck passaram na VPS.

### Task 4 — consultas reais: concluída e aprovada

- `apps/web/src/lib/reports/queries.ts` e testes.
- Serviços reais: `getCommercialReport`, `getOperationsReport`, `getFinancialReport`.
- Taxas/médias sem denominador retornam `null`, não zero inventado.
- Dados financeiros filtram sempre `scope="company"`.
- Chamado legado com `resolvedAt` e sem início aparece no evento, mas não contamina a média.
- Vitest 5/5, typecheck e ESLint focado passaram.
- Comparação com SQL independente no banco de desenvolvimento confirmou os agregados testados.

### Task 5 — CSV e API: concluída e aprovada

- `apps/web/src/lib/reports/csv.ts` e testes.
- `apps/web/src/app/api/reports/export/route.ts`.
- CSV com BOM UTF-8, `;`, CRLF, escape, proteção contra formula injection, moeda brasileira e datas Fortaleza.
- Endpoint autenticado, parâmetros Zod estritos, `private, no-store` e auditoria sem conteúdo sensível.
- Vitest 4/4; E2E da API passou em Chromium e mobile para 401, 400 e 200/headers.

### Task 6 — interface: concluída e aprovada

- Substituído o preview de `/app/inteligencia/relatorios` por Server Component real.
- Consultas em `Promise.all`, seletor de período e exportação por seção.
- Painéis Comercial, Operacional e Financeiro com explicação das bases temporais.
- `Sem dados` para taxas/médias nulas; todos os valores financeiros usam `money-value`.
- Interface mobile sem overflow em Pixel 7 e desktop; período inválido recua para `30d`.
- Após revisão, foi removido import sem uso e aplicado `tabular-nums` aos KPIs.
- Typecheck e lint focado passaram; build ficou reservado para o checkpoint.

### Task 7 — E2E consolidado: em andamento, não aprovado

Arquivo: `apps/web/e2e/relatorios.spec.ts`.

O spec agora contém:

- dados únicos por execução;
- provas existentes da API e dos timestamps de oportunidade/chamado/portal;
- criação real por UI de lead, oportunidade, proposta, contrato, projeto, aprovação, horas e lançamentos empresarial/pessoal;
- asserções dos três painéis, período, links CSV e ausência de overflow;
- leitura dos CSVs comercial, operacional e financeiro;
- exigência de que o CSV financeiro contenha o lançamento empresarial e não contenha o pessoal;
- testes seriais menores e timeout de 120 s no fluxo longo;
- restauração da sessão administrativa depois dos fluxos públicos.

Última execução completa conhecida na VPS: 11 testes.

- Passaram: setup; ciclo de oportunidade/chamado no Chromium; lead+financeiro no Chromium; API CSV no Chromium; ciclo e lead+financeiro no mobile.
- Falhou no Chromium: `cria o projeto, a aprovação e as horas do período`, ao acessar/preencher a proposta pública. O GET respondeu 200, mas o formulário esperado não apareceu; uma tentativa anterior mostrou `Link inválido ou expirado`.
- A falha serial pulou a prova final dos painéis/CSVs.
- Typecheck passou após a alteração mais recente.

Última alteração ainda sem Playwright concluído: em vez de copiar o campo readonly, o teste passou a construir a URL pública da proposta com `link_token` da URL interna e `publicSlug` consultado no banco. Essa hipótese precisa ser validada primeiro.

Um Playwright focado que estava em execução foi encerrado explicitamente durante este handoff. Não ficou processo `playwright test e2e/relatorios.spec.ts` ativo na VPS.

Próximos passos imediatos:

1. Ler o spec atual e confirmar como os E2E existentes obtêm a URL pública válida de proposta.
2. Rodar somente o caso focado Chromium `cria o projeto` e diagnosticar o token sem criar atalhos por insert direto.
3. Quando passar, rodar `PORT=3010 npx playwright test e2e/relatorios.spec.ts` em Chromium e mobile.
4. Escrever `.superpowers/sdd/reports-task-7-report.md` e submeter a revisão independente.
5. Executar a Task 8/checkpoint: limpar somente `apps/web/.next` na VPS e rodar typecheck, lint, Vitest, build, E2E focado e `git diff --check`.

## 6. Notificações e Telegram — especificado, ainda não implementado

Não existe implementação desse bloco no working tree. O plano tem 12 tarefas e deve começar somente depois do checkpoint verde de relatórios.

Decisões aprovadas:

- central interna persistente é a fonte confiável;
- Telegram é privado, bidirecional e nunca bloqueia a ação principal do CRM;
- comandos estruturados: `/hoje`, `/buscar termo`, `/tarefa descrição [| DD/MM/AAAA HH:mm]`, `/nota empresa|projeto código | texto`, `/ajuda` e `/cancelar`;
- escritas exigem confirmação por botão inline, expiram em 10 minutos e são idempotentes/atômicas;
- somente `TELEGRAM_CHAT_ID` autorizado pode consultar ou escrever;
- webhook valida `X-Telegram-Bot-Api-Secret-Token` antes de tocar no banco;
- `update_id` único evita efeitos duplicados;
- segredos nunca entram no banco, HTML, logs ou Git;
- mensagens não expõem documentos, detalhes financeiros, notas ou tokens públicos.

Variáveis necessárias para a validação externa, ainda não fornecidas/configuradas neste trabalho:

- `TELEGRAM_ENABLED`;
- `TELEGRAM_BOT_TOKEN`;
- `TELEGRAM_CHAT_ID`;
- `TELEGRAM_WEBHOOK_SECRET`;
- `BETTER_AUTH_URL` já deve apontar para a URL pública correta no ambiente.

Não fechar a Fase 10 sem testar com bot/chat reais: `getMe`, webhook, mensagem, `/hoje`, `/buscar`, tarefa confirmada, nota confirmada, duplicidade, expiração e chat não autorizado.

## 7. Working tree atual

Arquivos rastreados modificados:

- `apps/web/src/app/(crm)/app/comercial/oportunidades/actions.ts`;
- `apps/web/src/app/(crm)/app/inteligencia/relatorios/page.tsx`;
- `apps/web/src/app/(crm)/app/operacao/suporte/actions.ts`;
- `apps/web/src/app/(public)/portal/actions.ts`;
- `packages/database/drizzle/meta/_journal.json`;
- `packages/database/src/schema.ts`.

Arquivos/diretórios não rastreados relevantes:

- `apps/web/e2e/relatorios.spec.ts`;
- `apps/web/src/app/api/reports/`;
- `apps/web/src/lib/reports/`;
- `docs/superpowers/`;
- `packages/database/drizzle/0008_giant_khan.sql`;
- `packages/database/drizzle/meta/0008_snapshot.json`.

Antes de qualquer edição, execute `git status --short`. Não descarte, sobrescreva ou faça reset dessas mudanças.

## 8. Regras operacionais importantes

- Leia primeiro `docs/handoff-codex.md`, depois `docs/progresso.md`, `docs/validacao.md`, `docs/decisoes-tecnicas.md` e `docs/operacao.md`.
- Use `rg` para busca e `apply_patch` para edições manuais.
- Preserve mudanças não relacionadas do usuário.
- Nunca use credenciais de produção em testes ou no Git.
- Não crie automaticamente administrador de produção.
- Não use a porta 3000 da VPS para dev; ela pertence ao Dokploy. Use 3010.
- Migrações 0008 e futura 0009 devem ser aplicadas primeiro em desenvolvimento. Em produção, somente depois do commit/push, deploy saudável e conforme `docs/operacao.md`.
- A sequência de fechamento de uma fase é: checks focados, suíte completa, docs, revisão de diff/secrets, commit único, push em master, acompanhar deploy, health 200, migração em produção e smoke real.
- O SSH da VPS pode cair intermitentemente. Após timeout, espere aproximadamente 90–150 s antes de tentar novamente.

## 9. Depois da Fase 10

Continuar sem pausa artificial:

- Fase 11: PWA, segurança e backups;
- Fase 12: testes e correções finais.

Para cada uma: ler regras/briefing/fluxos, fechar design e plano, implementar de verdade, criar E2E real, validar na VPS, atualizar os documentos de acompanhamento e só então commitar/pushar.

## 10. Critério de conclusão do handoff

Este handoff não representa uma fase pronta para commit. A Fase 10 está intencionalmente em working tree. O primeiro objetivo do próximo agente é estabilizar e aprovar a Task 7 de relatórios sem perder nenhuma mudança existente.
