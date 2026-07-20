# Handoff para o Codex — PULSO CRM

Documento de transição escrito em 20/07/2026, pausando no meio da Fase 9. Leia isto primeiro, depois `docs/progresso.md` (o que está pronto, fase por fase), `docs/validacao.md` (o que foi testado e como) e `docs/decisoes-tecnicas.md` (por que as coisas foram feitas do jeito que foram — tem vários "por quê" que evitam retrabalho).

## Onde as coisas estão

- **Repositório**: `D:\PULSO\PULSO_CRM_NOVA_BASE\pulso-crm` (local, Windows), GitHub `https://github.com/PULSOsh/CRM-PULSO.git`, branch `master`.
- **Produção real**: `https://crm.pulsosh.cloud` — no ar, banco migrado e semeado, mas **sem usuário administrador ainda**. Acesse `https://crm.pulsosh.cloud/onboarding` e crie o admin manualmente (nome, e-mail, senha) — nenhuma automação deve criar essa credencial de produção por você.
- **Ambiente de dev/teste** (usado durante toda a construção, VPS `pulso@191.96.251.124`, pasta `~/pulso-crm-app`, banco `pulso_crm` — **separado** do banco de produção `pulsodb`):
  - Login de teste (não é produção, é só para rodar `npm run typecheck/lint/build` e a suíte Playwright na VPS): `admin.e2e@pulso.local` / `senha-de-teste-e2e-123` (definido em `apps/web/e2e/auth.setup.ts`, cria a conta sozinho se ainda não existir).
  - SSH: chave `~/.ssh/pulso_vps` (passphrase-protected — **use o PowerShell tool para ssh/scp, nunca o Bash tool**, porque o Git Bash não consegue desbloquear a chave e falha com "Permission denied (publickey)" mesmo com a chave correta).
  - SSH cai intermitentemente (não é fail2ban, não é carga alta — parece blip de rede antes de chegar no sshd). Se der timeout, espere ~90-150s e tente de novo em vez de insistir.

## Runbooks que já existem — leia antes de reinventar

- `docs/operacao.md` § "Ambiente de desenvolvimento atual": como sincronizar código local → VPS, rodar checks, etc.
- `docs/operacao.md` § "Deploy de produção": API do Dokploy (como listar apps, atualizar env vars, disparar redeploy, regenerar rota de domínio no Traefik), como rodar migração/seed direto dentro do container de produção. **Tem uma tabela de endpoints da API do Dokploy com exemplos** — não redescobrir isso na unha de novo.
- `docs/regras-de-negocio.md`: as regras de negócio curtas que orientaram cada decisão de escopo (ex.: "Sem cadastro público", "Notas internas nunca aparecem no portal").

## O que está pronto (Fases 0–8, todas testadas e em produção)

CRM comercial completo: leads, contatos/empresas, oportunidades (Kanban), produtos/catálogo real da PULSO, briefing persistente com link público, proposta versionada com aceite público, contrato com assinatura interna/externa, financeiro manual (contas a receber/pagar, estorno, livro pessoal separado), projetos (gerados idempotentemente a partir de contrato assinado), tarefas, arquivos com lixeira, aprovações com link público de token único, controle de horas (manual + timer). Tudo com Server Actions reais, banco Postgres real, zero mock. 83 testes E2E passando (chromium + mobile) até o fim da Fase 8.

## Onde a Fase 9 parou (portal do cliente e suporte)

**Código completo, buildado, tipado — não commitado ainda.** `git status` no repo local mostra os arquivos novos/modificados abaixo, todos já sincronizados na VPS de dev/teste, migração `0007_fearless_killraven.sql` já gerada, aplicada na VPS de dev **e trazida de volta pro repo local** (está em `packages/database/drizzle/`, só falta o `git add`).

**O que foi construído:**
- Autenticação própria do portal (`apps/web/src/lib/portal-auth.ts`) — **não** usa Better Auth (que é só para o admin interno único). Senha com `scrypt` nativo do Node, sessão via cookie próprio (`portal_session`) + tabela `portal_sessions` (token hash, nunca texto puro — mesmo padrão de propostas/contratos/aprovações).
- Convite sem cadastro público: admin convida (`/app/relacionamento/portal/novo`) buscando a empresa, gera link de ativação de uso único; cliente define a própria senha em `/portal/ativar/[id]?token=...`.
- Acesso por projeto (`portal_permissions`, chave primária `(portalUserId, projectId)` — **atenção**: o schema original tinha a chave errada `(portalUserId, role)`, o que tornaria impossível conceder mais de um projeto por usuário; já corrigido nesta fase, migração inclusa).
- Portal do cliente (`/portal`, rota `(app)` protegida por `layout.tsx` que checa a sessão do portal, não a do admin): lista projetos liberados, aprovações pendentes (decide direto pela sessão do portal, sem precisar do link de token separado), arquivos com `visibility="client"`.
- Suporte: `tickets` + nova tabela `ticket_messages` (campo `visibility` "internal"/"client" — nota interna nunca aparece pro cliente). Cliente abre chamado e responde pelo portal; admin responde por `/app/operacao/suporte/[id]` escolhendo se a mensagem é nota interna ou visível ao cliente.
- `/api/files/[id]` foi estendido para aceitar também sessão de portal (antes só aceitava sessão do admin interno) — só libera se o arquivo for `visibility="client"` e o usuário tiver acesso concedido ao projeto dono do arquivo.
- **Bug real encontrado e corrigido, fora do escopo direto da fase**: `createOpportunity` (`apps/web/src/app/(crm)/app/comercial/oportunidades/actions.ts`) nunca setava `companyId` na oportunidade — só `contactId`. Isso quebrava qualquer feature que dependesse de projeto→empresa (exatamente o que o portal precisa). Corrigido derivando `companyId` do contato selecionado via `company_contacts`.

**O que falta literalmente para fechar a fase:**
1. Rodar a suíte `portal.spec.ts` de novo — 8 de 11 testes passavam na última rodada; os 3 que faltavam validar falharam por **dados de teste não únicos entre reexecuções** (mesmo padrão já visto e documentado em `docs/decisoes-tecnicas.md` — título de chamado fixo colidindo com uma tentativa anterior), não por bug de produto. **O fix já foi aplicado** (`TICKET_TITLE` agora tem `Date.now()`) e sincronizado pra VPS, **mas não foi revalidado rodando o teste de novo** — essa é a primeira coisa a fazer.
2. Depois do `portal.spec.ts` passar sozinho, rodar a suíte completa (`npx playwright test` sem filtro, chromium + mobile) pra checar regressão nas fases anteriores.
3. Atualizar `docs/progresso.md`, `docs/validacao.md`, `docs/decisoes-tecnicas.md` com a seção da Fase 9 (seguir exatamente o mesmo formato das seções de Fases 1–8 já escritas nesses arquivos — copiar a estrutura).
4. `git add` + commit + `git push origin master`. **O push vai disparar redeploy automático em `crm.pulsosh.cloud`** (comportamento desejado, configurado assim de propósito — não tentar parar o serviço do Dokploy).
5. Depois do push, a migração `0007` também precisa rodar em produção (o banco `pulsodb` de produção **não** tem essa migração ainda): `docker exec <container-do-app> sh -c "cd /app && npm run db:migrate"` — ver `docs/operacao.md` § "Deploy de produção" pro passo a passo completo (como pegar o container id, etc.).

## O que falta depois da Fase 9

Seguir exatamente o mesmo ritmo e rigor das fases anteriores — ler as seções relevantes de `docs/briefing-final.md`, `docs/regras-de-negocio.md` e `docs/fluxos.md` antes de cada uma, implementar com Server Actions reais (nunca mock), escrever E2E Playwright real, validar na VPS, documentar, commitar, dar push.

- **Fase 10 — relatórios, notificações e integrações opcionais**: painéis de indicadores reais (não inventar números — derivar do banco); notificações internas (pelo menos um canal funcionando, ex. Telegram, mantendo o princípio de "integração nunca bloqueia o core"); ver `docs/decisoes-tecnicas.md` pelas pendências já anotadas de fases anteriores que dependem desta (ex.: alertar admin quando cliente pede condição alternativa em proposta, ou solicita alterações numa aprovação).
- **Fase 11 — PWA, segurança e backups**: manifest/service worker reais; rotina de backup automatizada (`docs/operacao.md` já tem a rotina recomendada, só falta automatizar); hardening geral.
- **Fase 12 — testes e correções finais**: revisão ponta a ponta, fechar qualquer lacuna conhecida documentada em `docs/progresso.md` § "Não iniciado" de cada fase.

## Padrões estabelecidos que valem a pena seguir (evitam bugs já resolvidos antes)

1. **Nunca criar tabelas especulativas** — esquema cresce sob demanda, só quando uma feature concreta precisa (documentado e seguido rigorosamente desde a Fase 2).
2. **Server Action chamada direto de `onClick` de Client Component que muda um campo `status`** usado por uma renderização condicional do componente pai **pode apagar estado local** por causa da revalidação automática do Next — aconteceu 3+ vezes (briefing, proposta, contrato). Solução definitiva: `redirect()` com o segredo (token de link público) na query string, nunca depender de `useState` pra mostrar um link/confirmação de uso único.
3. **`FormData.get()` de um campo que não existe no formulário retorna `null`, não `undefined`** — `z.string().optional()` rejeita `null`. Usar `.nullish()` quando o campo pode estar ausente do DOM (checkbox desmarcado, campo condicional). Já mordeu esse projeto 3 vezes.
4. **Dados de teste (nomes, títulos, e-mails) precisam ser únicos por execução** (`Date.now()` no final) — a suíte roda várias vezes contra o mesmo banco da VPS de dev, strings fixas colidem com tentativas anteriores e quebram `getByText` por "strict mode violation".
5. **PowerShell + SSH + bash remoto + curl/psql, encadeados, mastigam aspas de forma imprevisível.** Regra prática: para qualquer payload JSON ou comando complexo, escrever num arquivo local, copiar via `scp`, referenciar o arquivo remotamente (`curl -d @file.json`, `psql -f file.sql`) em vez de tentar inline.
6. **Sempre `rm -rf apps/web/.next` antes de `npm run check`** se alternou entre `next dev` (usado pelos testes) e `next build` na mesma pasta — o cache de tipos de rota fica inconsistente entre os dois modos.

## Prompt sugerido para dar ao Codex

```
Continue o desenvolvimento do PULSO CRM a partir de onde parou. Leia primeiro
docs/handoff-codex.md (este arquivo), depois docs/progresso.md, docs/validacao.md
e docs/decisoes-tecnicas.md para entender o que já foi feito e por quê.

A Fase 9 (portal do cliente e suporte) está com código completo, tipado e
buildando, mas não commitada -- falta revalidar apps/web/e2e/portal.spec.ts
(o único problema conhecido era dado de teste não-único entre execuções, já
corrigido, precisa só rodar de novo pra confirmar), rodar a suíte completa
pra checar regressão, atualizar os três docs de acompanhamento seguindo o
mesmo formato das fases anteriores, e então commitar e dar push (o que
redeploya automaticamente https://crm.pulsosh.cloud -- é o comportamento
esperado). Depois do push, rodar a migração 0007 no banco de produção
(pulsodb) -- docs/operacao.md tem o passo a passo.

Depois de fechar a Fase 9, continue com a Fase 10 (relatórios, notificações
e integrações opcionais), Fase 11 (PWA, segurança e backups) e Fase 12
(testes e correções finais), seguindo o mesmo padrão rigoroso das fases
anteriores: implementação real (nunca mock), testes E2E reais via Playwright
na VPS, documentação atualizada a cada fase, commit e push só depois de tudo
validado.
```
