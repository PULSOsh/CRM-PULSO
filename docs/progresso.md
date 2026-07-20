# Progresso transparente

## Implementado nesta entrega

### Fundação

- Monorepo com workspaces.
- Next.js App Router.
- TypeScript estrito.
- Tailwind CSS.
- Docker e PostgreSQL.
- PWA manifest.
- Tema claro e escuro.
- Ocultação de valores.
- Identidade visual PULSO.
- Navegação desktop e mobile.
- Health check.

### Banco e autenticação

- Conexão PostgreSQL/Drizzle.
- Schema inicial amplo.
- Tabelas do Better Auth.
- Configuração do Better Auth.
- Seed do pipeline e produtos.

### Interface

- Central de hoje.
- Páginas de módulos.
- Projetos.
- Tarefas e calendário.
- Financeiro empresarial.
- Finanças pessoais.
- Assistente de IA.
- Configuração de integrações.
- Busca global.
- Preview estático.

### Páginas públicas

- Briefing demonstrativo com autosave visual.
- Proposta interativa com adicionais e parcelas.
- Portal do cliente autenticado e persistente.

### Infraestrutura de domínio

- EmailProvider de desenvolvimento.
- Templates HTML/CSS inline.
- Interfaces de IA, assinatura, pagamento e Telegram.
- Assinatura interna.
- Pagamento manual.
- Armazenamento privado local.
- Hash de documentos.
- Rota pública de captura de lead com Zod e honeypot.

### Qualidade

- Teste unitário de códigos.
- Testes E2E de fumaça preparados.
- Documentação consolidada.

## Parcial

- Schema cobre o núcleo, mas faltam tabelas complementares listadas em `banco-de-dados.md`.
- Alguns módulos ainda usam dados demonstrativos (prospecção, recorrência, assistente de IA e integrações não configuradas).
- PDF possui contrato de interface e placeholder; renderização real via Chromium ainda precisa ser ligada.
- PWA tem manifest; service worker e sincronização offline ainda não estão implementados.
- Modo demonstração está representado por dados e configuração; isolamento de banco precisa ser aplicado no deploy.
- E-mail possui renderer e modo dev; SMTP e Resend precisam de adapters.
- Arquivos privados usam adapter e rotas reais; backup externo automatizado ainda precisa ser conectado.

## Não implementado ainda

- CRUD persistente completo de todos os módulos.
- Automações transacionais.
- Builder de templates.
- Mensagens omnichannel fora do suporte.
- Importação CSV/Excel.
- Exportações.
- ZapSign real.
- AbacatePay real.
- Google Calendar.
- Providers reais de IA.
- Notificações push.
- Backup executado pela interface.
- Conciliação ou importação bancária, que não faz parte da primeira versão.
- Teste completo do fluxo ponta a ponta.

## Fase 10: Notificações internas e Telegram
**Status:** Concluída
- [x] Schema `admin_notifications` e tabelas Telegram (`telegram_updates`, `telegram_pending_actions`)
- [x] Migrações geradas e aplicadas
- [x] Provider HTTP Telegram independente
- [x] Lógica de `notifyAdmin` idempotente, não-bloqueante
- [x] Central de Notificações Interna (Visualização e Ações Rápidas)
- [x] Extração de métricas de `hoje` para envio via Telegram
- [x] Parseador e processador de Comandos Telegram Webhook com Zod
- [x] E2E validando isolamento e não-bloqueio ponta a ponta.

## Fase 0 — compilação e infraestrutura (concluída em 19/07/2026)

- `npm install`, `typecheck`, `lint`, `test`, `build` executados com sucesso (ambiente: VPS `pulso@191.96.251.124`, Node 20, ver `docs/operacao.md`).
- PostgreSQL 17 isolado via `docker compose` (`pulso-crm-app-db-1`), sem impacto em outros serviços da VPS compartilhada.
- Migração inicial gerada e aplicada (`packages/database/drizzle/0000_equal_gravity.sql`, 29 tabelas) e seed de pipeline/produtos executado.
- `docker compose up` validado de ponta a ponta (build multi-stage da imagem `web` + `db`), `/api/health` respondendo pelo container real.
- Repositório Git local inicializado com commit base da fundação recebida.
- Decisão de ambiente registrada em `docs/decisoes-tecnicas.md`.

## Fase 1 — autenticação e onboarding (concluída em 19/07/2026)

- Better Auth concluído: login interno real (`/login`), recuperação de senha (`/esqueci-senha`, `/redefinir-senha` via `authClient.requestPasswordReset`/`resetPassword`), logout, listagem de sessões e "sair de todos os dispositivos" (`/app/configuracoes/seguranca`).
- Middleware (`apps/web/src/middleware.ts`) protege todas as rotas `/app/**`, redirecionando para `/login?redirect=...` quando não há sessão. `(crm)/app/layout.tsx` faz uma segunda verificação real de sessão no servidor (defesa em profundidade) e injeta o usuário autenticado na Sidebar (nome, inicial, logout).
- Onboarding controlado em `/onboarding` (3 etapas): (1) criação do administrador único — só é possível enquanto a tabela `user` estiver vazia, usa `auth.$context.internalAdapter` diretamente (não a rota pública de sign-up, que fica desativada em produção) para respeitar a regra "administrador interno único"; (2) dados institucionais da PULSO e meta de receita mensal, persistidos em `app_settings` (tabela nova, singleton); (3) revisão informativa de integrações (todas com fluxo manual/"pular" por padrão) e conclusão, que marca `onboarding_completed_at`.
- Rate limit habilitado (`auth.ts`): 5 tentativas/60s em `/sign-in/email`, 3/60s em `/forget-password`, 20/60s geral.
- Auditoria automática de `auth.admin_created`, `onboarding.completed`, `auth.login_success`, `auth.login_failed` e `auth.logout` via hook `after` do Better Auth, gravando em `audit_events` (`packages/database/src/audit.ts`).
- Template de e-mail de redefinição de senha adicionado (`packages/email`), enviado pelo provider de desenvolvimento (log no console) — SMTP/Resend reais ficam para a Fase 10 (integrações).
- Testes E2E de onboarding/login/logout (`apps/web/e2e/auth.spec.ts`) e smoke test atualizado para refletir o novo bloqueio de rota (`apps/web/e2e/smoke.spec.ts`).

## Fase 2 (em andamento) — banco e domínio, expandido sob demanda

Decisão registrada em `docs/decisoes-tecnicas.md`: em vez de desenhar de uma vez todas as tabelas especulativas da seção 7 do prompt mestre, o schema cresce conforme cada fase realmente precisa (evita abstração prematura para funcionalidade ainda não construída). Adicionado até agora:

- `leads`: entidade própria anterior à oportunidade, com status (`new`→`contacted`→`qualifying`→`qualified`/`disqualified`/`converted`), origem, UTM, vínculo com contato/empresa/oportunidade quando convertido.
- `prospecting_lists` / `prospecting_items`: suporte à pré-pipeline de prospecção (ainda sem CRUD ligado — próximo passo).
- `app_settings` (Fase 1) e helper `nextSequence()` (`packages/database/src/counters.ts`) para códigos sequenciais atômicos (`LEAD-2026-0001`, `CTT-2026-0001`, etc., via `INSERT..ON CONFLICT` na tabela `counters`).

## Fase 3 (em andamento) — CRM comercial persistente

### Leads — completo

- Listagem real com busca (nome/e-mail/telefone/empresa), filtro por status e por "sem próxima ação", paginação (`/app/comercial/leads`).
- Criação manual (`/app/comercial/leads/novo`) e captura pública real (`POST /api/public/forms/lead`, com honeypot, agora persiste em vez de simular).
- Detalhe (`/app/comercial/leads/[id]`): dados de contato, histórico de atividades, transições de status (contatado → qualificando → qualificado), desqualificação com motivo obrigatório, conversão em oportunidade (cria/reaproveita contato por e-mail/telefone, cria oportunidade na primeira etapa do pipeline padrão, marca o lead como convertido).
- Lixeira lógica (`trashedAt`), auditoria em todas as mutações, `revalidatePath` explícito após cada Server Action (necessário — o refresh automático do App Router não cobre esse caso de uso).
- Testes E2E (`apps/web/e2e/leads.spec.ts`): criar, buscar, mudar status, converter — 100% verde em chromium e mobile.

### Contatos e empresas — completo

- Uma tela (`/app/comercial/contatos`) com abas Contatos/Empresas, cada uma com busca e paginação real.
- Criação, edição inline e lixeira lógica para ambas as entidades.
- Vínculo N:N contato↔empresa: buscar contato existente e vincular a uma empresa, desvincular, ver empresas vinculadas na tela do contato e vice-versa.
- Detecção de duplicidade por e-mail/telefone (contato) e documento (empresa) antes de criar — bloqueia e linka para o registro existente. Mesclagem (merge) de duplicados ainda não implementada.
- Testes E2E (`apps/web/e2e/contatos.spec.ts`): criar/editar contato, bloquear duplicado, criar empresa e vincular contato, buscar — 100% verde em chromium e mobile.

### Oportunidades — completo

- Kanban real (`/app/comercial/oportunidades`) agrupado por etapa do pipeline padrão, com seletor de pipeline quando houver mais de um.
- Criação manual exigindo próxima ação (regra "toda oportunidade aberta precisa de próxima ação" aplicada no formulário, com seleção opcional de contato via busca).
- Mudança de etapa direto no card do board (grava atividade + auditoria); detalhe (`/app/comercial/oportunidades/[id]`) com edição da próxima ação, "marcar como ganho" e "marcar como perdido" com motivo obrigatório.
- Testes E2E (`apps/web/e2e/oportunidades.spec.ts`): criação com validação HTML5 de campo obrigatório, aparição no board, mudança de etapa, perda com motivo — 100% verde em chromium e mobile.
- Histórico de movimentação de etapa registrado via `activities` (não uma tabela dedicada — decisão consistente com "schema sob demanda").

### Produtos e serviços — completo

- Catálogo (`/app/comercial/produtos`) com busca, filtro por categoria (derivado dos produtos existentes) e distinção visual ativo/arquivado.
- Criar, editar, arquivar/reativar, duplicar (gera código único `-COPIA`, `-COPIA2`, ...).
- Código único validado tanto na criação quanto na edição.
- Testes E2E (`apps/web/e2e/produtos.spec.ts`): lista o seed, cria, bloqueia código duplicado, arquiva, duplica — 100% verde em chromium e mobile.

### Fase 3 — status final: CRM comercial persistente concluído

Leads, Contatos/Empresas, Oportunidades (Kanban) e Produtos têm CRUD real, persistente, testado ponta a ponta (35 testes E2E, chromium + mobile). Falta apenas Prospecção (schema já existe desde a Fase 2, sem UI ainda) — fica para quando o fluxo de pré-pipeline for priorizado; não bloqueia o restante do roadmap porque leads já cobrem a entrada manual/pública de oportunidades.

## Fase 4 — briefing persistente (concluída em 19/07/2026)

- Schema novo: `briefing_templates` (perguntas versionadas em JSONB) + `briefings` ganhou `templateId`, `questionsSnapshot` (cópia imutável das perguntas no momento do envio — alterar o template depois não afeta briefings já enviados), `startedAt`, `analyzedAt`.
- Helper reutilizável `packages/database/src/tokens.ts` (`generatePublicToken`/`hashPublicToken`/`generateSlug`) — será reaproveitado nas Fases 5 e 6 para links públicos de proposta e assinatura.
- Template padrão semeado (9 perguntas cobrindo objetivo, público, referências, diferenciais, conteúdo pronto, prazo, orçamento, resultados desejados, observações) com todos os tipos suportados: texto, textarea, seleção, múltipla escolha, sim/não, data, moeda e link.
- Fluxo interno (`/app/comercial/briefings`): gerar link (busca de oportunidade, produto opcional) — o link com token só é mostrado uma vez, nunca fica recuperável depois (token salvo como hash); pular briefing com justificativa obrigatória e auditada, restrito a produtos marcados `allowBriefingSkip`; regenerar link (revoga o anterior); marcar como analisado; arquivar.
- Página pública (`/briefing/[slug]?token=...`): valida token contra o hash salvo, autosave por campo (`onBlur`), barra de progresso calculada a partir das perguntas obrigatórias respondidas, conclusão bloqueada até todas as obrigatórias estarem preenchidas, tela final de agradecimento.
- Conclusão do briefing: idempotente, cria tarefa interna "Analisar briefing", registra atividade na oportunidade, avança a etapa do pipeline para "Briefing recebido" (e "Briefing solicitado" ao criar) por nome — sem acoplar a um pipeline específico.
- Testes E2E (`apps/web/e2e/briefings.spec.ts`) cobrindo o ciclo completo **sem sessão interna** na parte pública (limpa cookies antes de simular o cliente): gera link → cliente responde e conclui → aparece concluído no painel → marca como analisado.

## Fase 5 — proposta versionada (concluída em 19/07/2026)

- Schema: `proposals` ganhou campos de aceite (versão aceita, nome/documento/IP/user-agent do aceitante, detalhes da aceitação, rejeição com motivo); `proposal_versions` ganhou `viewCount`/`viewedAt`; nova tabela `proposal_change_requests` para pedidos de condição alternativa (não altera a proposta vigente, fica pendente até o admin decidir). Tipos `ProposalContent`/`ProposalItem`/`ProposalAddon`/`PaymentCondition` versionados dentro do snapshot JSONB de cada versão — mesmo padrão de imutabilidade do briefing.
- Componente `OpportunityPicker` extraído para `apps/web/src/components/` e reaproveitado por Briefings e Propostas (era duplicado).
- Fluxo interno: criar proposta exige briefing concluído ou pulo aprovado na oportunidade (bloqueio real, não só de interface); editor de rascunho com itens de escopo/adicionais/condições de pagamento dinâmicos (somam para o subtotal, calculado no servidor); publicar congela snapshot com hash; nova versão só pode ser criada depois que a anterior for publicada; pedidos de condição alternativa aparecem para aprovar/rejeitar.
- Página pública: cálculo de total sempre recomputado no servidor a partir do snapshot (nunca confia no cliente); cliente escolhe adicionais e condição de pagamento; aceite registra nome, documento, IP, user-agent e declaração explícita; recusa e "solicitar outra condição" (esta última não altera a versão vigente, só cria um pedido).
- Testes E2E (`apps/web/e2e/propostas.spec.ts`): bloqueio sem briefing → pula briefing → cria proposta → publica com itens reais → cliente aceita com adicional selecionado → aparece aceita no painel — 5/5, mais suíte completa 49/49 (chromium + mobile).

## Fase 6 — contrato e assinatura interna (concluída em 20/07/2026)

- Schema: `contracts` ganhou `opportunityId`, link público (`publicSlug`/`publicTokenHash`), `signedFileId`, cancelamento (`cancelledAt`/`cancelReason`); novas tabelas `contract_signatories` (um ou mais signatários, papel `pulso`/`client`, evidências de assinatura) e `contract_events` (log imutável com `idempotencyKey` único preparado para webhooks futuros do ZapSign).
- **Upload/download de arquivos privados finalmente conectado** (`/api/files` POST, `/api/files/[id]` GET) — usa o `LocalPrivateStorage` que já existia desde a fundação mas nunca tinha rota real. Autenticado, grava metadados em `files`, hash SHA-256 automático (via o próprio adapter).
- Fluxo interno (`/app/comercial/contratos`): gerar rascunho a partir de proposta aceita (bloqueia se a proposta não estiver aceita; idempotente — gerar de novo para a mesma versão aceita retorna o contrato já existente em vez de duplicar); cláusulas com texto padrão editável enquanto rascunho; gerenciar signatários; revisar e enviar (gera link público, token só exibido uma vez); assinatura interna da PULSO com evidências (nome, documento, IP, user-agent, declaração); upload de documento assinado externamente como alternativa à assinatura interna; cancelamento com motivo obrigatório (preserva documento e eventos, não apaga nada).
- Página pública (`/contrato/[slug]?token=...`): mostra cláusulas e signatários, cliente assina com evidências completas; quando todos os signatários assinam, o contrato congela (hash do conteúdo + signatários) e **prepara automaticamente um recebível** em `financial_entries` (schema já existia desde a fundação; a Fase 7 vai construir a tela de gestão desses lançamentos) — sem gerar cobrança nem enviar nada automaticamente, como exigido pelas regras de negócio.
- Assinatura ZapSign: não implementada (sem credenciais reais disponíveis) — `provider` já é um campo livre no schema (`internal`/`upload`/futuramente `zapsign`), e a estrutura de eventos idempotentes já está pronta para receber webhooks quando a integração for configurada.
- Testes E2E (`apps/web/e2e/contratos.spec.ts`): fluxo completo lead→briefing pulado→proposta aceita→contrato→assinatura do cliente (sem sessão)→assinatura interna da PULSO→recebível criado — 9/9, suíte completa 57/57 (chromium + mobile).

## Fase 7 — financeiro manual, empresa e pessoal (concluída em 20/07/2026)

- Sem migração nova: reaproveita `financial_accounts`/`financial_entries`, que já existiam no schema desde a fundação mas não tinham nenhuma tela real conectada.
- `apps/web/src/app/(crm)/app/financeiro/actions.ts`: `createReceivable`/`createPayable`/`createPersonalEntry` (geram código sequencial via `nextSequence`, namespace `charge`/`expense`); `registerPayment` (baixa manual, cumulativa — permite quitar em mais de uma parcela; status muda pending→partial→paid automaticamente comparando `amountActual` com `amountExpected`; grava quem deu a baixa em `activities`); `reverseEntry` (estorno **nunca** apaga nem edita o lançamento original — cria um novo lançamento compensatório em sentido oposto e só anota `metadata.reversedBy` no original); `getFinancialSummary`/`getRecentCashFlow` para os KPIs e o gráfico de caixa.
- Contas a receber (`/app/financeiro/receber`) e a pagar (`/app/financeiro/pagar`): listagem real, criação manual, baixa (total ou parcial) e estorno, tudo com o mesmo componente `EntryActions`.
- Finanças pessoais (`/app/financeiro/pessoal`): livro **separado** do caixa da empresa (`scope: "personal"`, nunca somado sem uma consolidação explícita), aceita receita e despesa no mesmo formulário; proteção por PIN citada no prompt original ainda não implementada — aviso explícito na própria tela.
- Visão financeira (`/app/financeiro/visao`): KPIs reais (saldo realizado, a receber/pagar pendente, lançamentos vencidos) e gráfico de fluxo de caixa dos últimos 14 dias (regime de caixa, agrupado por dia via `to_char`).
- Contas a pagar/receber recorrentes (`/app/financeiro/recorrentes`) permanece como demo — decisão registrada em `docs/decisoes-tecnicas.md`: precisa de schema próprio para MRR/reajuste/ciclo de renovação, escopo maior que o resto da Fase 7 e não foi forçado para caber no mesmo lote.
- Testes E2E (`apps/web/e2e/financeiro.spec.ts`): cria conta a receber → baixa parcial → baixa total (status pending→partial→paid) → estorna e confirma que o lançamento original não muda enquanto o compensatório aparece do lado oposto (recebível estornado gera lançamento em "a pagar") → cria conta a pagar → cria lançamento pessoal e confirma que ele não aparece nas telas da empresa → visão financeira carrega — 6/6, suíte completa 67/67 (chromium + mobile; 1 falha isolada por rate-limit de login ao rodar a suíte inteira em sequência, confirmada como flakiness reproduzindo o mesmo teste sozinho com sucesso, não uma regressão desta fase).

## Fase 8 — projetos, arquivos, aprovações e horas (concluída em 20/07/2026)

- Schema: `approvals` ganhou `code` (sequencial, namespace `approval`/prefixo `APR`), link público (`publicSlug`/`publicTokenHash`, mesmo padrão de propostas/contratos), evidências de decisão (`decidedByName`, `decisionIp`, `decisionUserAgent`). `projects`, `tasks`, `files` e `time_entries` já existiam completos desde a fundação, sem uso real até agora — só a tabela `approvals` precisou de migração nova (`0006_furry_morlun.sql`).
- Geração de projeto a partir de contrato assinado (`/app/operacao/projetos/novo`), idempotente — mesmo padrão de "gerar contrato a partir de proposta aceita" da Fase 6: gerar de novo para o mesmo contrato retorna o projeto já existente.
- Tarefas: lista por projeto e lista global (`/app/operacao/tarefas`), com "atrasadas" separadas; tarefas sem projeto (`entityType`/`entityId` nulos) são tarefas gerais da operação.
- Arquivos: biblioteca real conectada ao upload/download que já existia desde a Fase 6 (`/api/files`) — listagem por projeto e global (`/app/operacao/arquivos`), com lixeira (soft-delete via `trashedAt`, restaurável).
- Aprovações: cada rodada gera um link público com token de uso único (mesmo padrão de assinatura/proposta); cliente decide sem sessão interna (aprovar ou solicitar alterações com comentário obrigatório); decisão também pode ser registrada internamente (fallback manual, ex.: cliente aprovou por WhatsApp). Nova rota pública `GET /api/public/aprovacoes/[slug]` para o cliente ver o arquivo vinculado à aprovação sem precisar de sessão — o token da aprovação é o único fator de autenticação, igual ao padrão já usado para link de proposta/contrato.
- Regra de negócio aplicada: projeto não pode ser concluído com aprovação pendente (`docs/regras-de-negocio.md` — "Projeto não conclui com aprovação obrigatória pendente"); conclusão registra `deliveredAt` e aceita `warrantyEndsAt` opcional informado manualmente (nenhum prazo de garantia padrão foi inventado — não há esse número em nenhum documento de origem).
- Horas: lançamento manual (data + duração HH:MM) e timer (iniciar/parar, calcula duração real), ambos por projeto; comparação estimado × realizado na página do projeto.
- **`/app/hoje` deixou de ser 100% dado fabricado** — métricas (pipeline aberto, projetos ativos, a receber pendente, itens vencidos), lista "precisa de atenção" (tarefas/aprovações/financeiro vencidos, oportunidades com próxima ação vencida) e o card de projetos em andamento agora vêm do banco. Removidos `packages/database/src/demo-data.ts` e `apps/web/src/components/project-board.tsx`, que não tinham mais nenhum uso real.
- Testes E2E (`apps/web/e2e/projetos.spec.ts`): lead→briefing pulado→proposta aceita→contrato assinado→projeto gerado (idempotente)→tarefa criada e concluída→arquivo enviado (com lixeira/restauração)→aprovação criada com link público→cliente aprova sem sessão→projeto concluído após aprovação decidida→horas manuais e timer — 9/9, suíte completa **83/83** (chromium + mobile).

### Correções fora do escopo direto da fase, feitas com a base de apoio de design/catálogo fornecida pelo usuário

- **Catálogo de produtos corrigido para bater com a oferta real da PULSO** (fonte: `catalogo.pulso.cloud`, snapshot fornecido pelo usuário) — o seed tinha um produto fabricado ("Site Profissional para Dentistas", nunca existiu no catálogo real) e faltava "SaaS ou White Label"; categorias e nomes de alguns produtos também estavam divergentes. Corrigido em `packages/database/src/seed.ts`: os 13 produtos reais ficam ativos com nome/categoria/preço/prazo corretos, o produto fabricado foi arquivado (não apagado, para não quebrar propostas/contratos antigos que já o referenciam).
- **Cores semânticas (sucesso/aviso/erro/info) alinhadas ao design system oficial** (`PULSO_VISUAL_DESIGN_SYSTEM_v1.0`, tokens fornecidos pelo usuário) — `apps/web/src/app/globals.css` ganhou `--success`/`--warning`/`--error`/`--info` com os hex canônicos (`#2E8B57`/`#D88A12`/`#C93C3C`/`#2B6CB0`), substituindo valores ad-hoc que já existiam desde a fundação da base.

## Fase 9 — portal do cliente e suporte (concluída em 20/07/2026)

- Portal sem cadastro público: o administrador convida um usuário vinculado a uma empresa em `/app/relacionamento/portal/novo`; o link de ativação usa token aleatório de uso único e o cliente define a própria senha. Convites, ativações, revogações e concessões de projeto são auditados.
- Autenticação própria e isolada do Better Auth interno: senha com `scrypt` nativo do Node, cookie `portal_session` `httpOnly`/`secure`/`sameSite=lax`, sessão persistida em `portal_sessions` apenas pelo hash do token e revogada no logout ou quando o acesso do usuário é cancelado.
- Permissões reais por projeto em `portal_permissions`, com chave primária corrigida para `(portalUserId, projectId)`. Cada usuário pode acessar vários projetos; cada projeto só aparece após concessão explícita do administrador.
- Portal autenticado em `/portal`: lista projetos liberados, arquivos marcados como visíveis ao cliente, aprovações pendentes e chamados da empresa. Aprovações podem ser decididas dentro do portal sem reutilizar o link público; a Server Action valida conjuntamente usuário, projeto e aprovação.
- Download privado ampliado com autorização dupla: a rota `/api/files/[id]` continua aceitando a sessão administrativa e, para o portal, só entrega arquivo `visibility="client"` vinculado a um projeto explicitamente concedido ao usuário.
- Suporte persistente: cliente abre chamado e responde no portal; administrador cria, acompanha, altera status e responde em `/app/operacao/suporte`. `ticket_messages.visibility` separa mensagens ao cliente de notas internas, que nunca são consultadas pelo portal.
- Correção de domínio necessária ao portal: `createOpportunity` passou a persistir `companyId` derivado do vínculo `company_contacts`; antes gravava apenas `contactId`, quebrando a cadeia oportunidade → contrato → projeto → empresa.
- Revisão de autorização antes do deploy: projeto informado em chamado precisa pertencer às permissões do usuário, uma aprovação precisa pertencer ao projeto concedido e o fluxo de convite bloqueia e-mail já usado, coerente com o login global por e-mail.
- Migração `0007_fearless_killraven.sql`: cria `portal_sessions` e `ticket_messages`, adiciona ativação/revogação a `portal_users` e corrige a chave de `portal_permissions`.
- Testes E2E (`apps/web/e2e/portal.spec.ts`): fluxo completo contato/empresa/oportunidade → contrato assinado → projeto → convite → ativação/login → aprovação → chamado → nota interna/mensagem ao cliente → revogação. **21/21** isolados (setup + chromium + mobile); na regressão completa, os 20 cenários do portal passaram novamente.

### Não iniciado

- Prospecção (schema pronto, CRUD pendente).
- Geração de PDF real de proposta/contrato (placeholder ainda, ver `packages/documents`).
- Notificação automática ao administrador quando o cliente pede condição alternativa em proposta, solicita alterações em uma aprovação ou abre/responde chamado (fica visível nos módulos, sem alerta ativo — depende da Fase 10).
- Contas recorrentes (MRR, reajuste, ciclo de renovação) — `/app/financeiro/recorrentes` ainda é demo.
- Proteção por PIN das finanças pessoais.
- Etapas/pipeline customizável por projeto (o prompt original permite, "podem ser personalizadas" — não é obrigatório; ficou com status fixo + lista de tarefas por ora, ver `docs/decisoes-tecnicas.md`).

## Próxima sequência recomendada

1. Contatos e empresas (CRUD completo, vínculo N:N).
2. Oportunidades (Kanban, pipelines, motivo de perda, próxima ação obrigatória).
3. Produtos e serviços.
4. Prospecção.
5. Briefing persistente.
6. Proposta versionada.
7. Contrato interno.
8. Financeiro manual.
9. Projeto, tarefas, arquivos e aprovações.
10. Portal.
11. Suporte e recorrência.
12. Relatórios, integrações e produção.

## Definição honesta

A entrega é uma base real, extensa, compilável e visualmente navegável. Não é o CRM final pronto para operação comercial. O objetivo é evitar a repetição de entregas apenas documentais, fornecendo código e arquitetura suficientes para desenvolvimento contínuo com rastreabilidade.
