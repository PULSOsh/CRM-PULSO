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
- Portal demonstrativo.

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
- Páginas de módulos usam dados demonstrativos.
- PDF possui contrato de interface e placeholder; renderização real via Chromium ainda precisa ser ligada.
- PWA tem manifest; service worker e sincronização offline ainda não estão implementados.
- Modo demonstração está representado por dados e configuração; isolamento de banco precisa ser aplicado no deploy.
- E-mail possui renderer e modo dev; SMTP e Resend precisam de adapters.
- Arquivos privados possuem adapter; rotas de upload e download ainda precisam ser conectadas.

## Não implementado ainda

- CRUD persistente completo de todos os módulos.
- Automações transacionais.
- Builder de templates.
- Convites e login do portal.
- Mensagens.
- Importação CSV/Excel.
- Exportações.
- ZapSign real.
- AbacatePay real.
- Google Calendar.
- Telegram.
- Providers reais de IA.
- Notificações push.
- Backup executado pela interface.
- Conciliação ou importação bancária, que não faz parte da primeira versão.
- Teste completo do fluxo ponta a ponta.

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

### Próximas entidades (não iniciadas)

- Contatos e empresas.
- Oportunidades (lista real + Kanban + detalhe — hoje só a lista é demo).
- Produtos e serviços.
- Prospecção (schema pronto, CRUD pendente).

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
