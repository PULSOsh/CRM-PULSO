# Validação da entrega

## Executado com sucesso

- 99 arquivos de código, configuração, preview e documentação foram criados.
- Todos os 66 arquivos TypeScript/TSX passaram por verificação sintática com o compilador TypeScript 5.8.3 disponível no ambiente.
- Todos os arquivos JSON foram validados.
- Todos os imports locais com alias `@/` apontam para arquivos existentes.
- Os ícones Lucide usados na interface foram verificados no pacote declarado.
- A prévia estática pode ser aberta sem dependências.

## Limitação da validação original

A instalação completa das dependências pelo registro npm do ambiente excedeu o limite de execução em tentativas sucessivas. Por isso, `next build`, Vitest e Playwright não foram concluídos aqui. A estrutura inclui os comandos necessários e deve ser validada novamente após `npm install` em um ambiente com acesso normal ao registro.

Essa limitação não foi ocultada em `docs/progresso.md`.

## Validação Fase 0 (19/07/2026)

Executado na VPS `pulso@191.96.251.124` (ver `docs/operacao.md` para o motivo do ambiente):

| Comando | Resultado |
|---|---|
| `npm install` | ✅ 525 pacotes instalados, 0 erros (7 vulnerabilidades moderadas em devDependencies, não bloqueantes) |
| `npm run typecheck` | ✅ 0 erros |
| `npm run lint` | ✅ 0 erros, 1 warning cosmético (`postcss.config.mjs`, export anônimo) |
| `npm run test` | ✅ 1/1 testes passando |
| `npm run db:generate` | ✅ 29 tabelas, migração `0000_equal_gravity.sql` |
| `npm run db:migrate` | ✅ aplicada em Postgres 17 real |
| `npm run db:seed` | ✅ pipeline comercial + 12 produtos |
| `npm run build` | ✅ compilação limpa, 34 rotas geradas (Next.js 16.2.10 / Turbopack) |
| `docker compose build` | ✅ imagem `web` gerada (220MB, multi-stage `node:22-alpine`) |
| `docker compose up` (db+web) | ✅ ambos saudáveis, `/api/health` respondendo pelo container |
| Navegação real (`/app/hoje`, `/app/comercial/oportunidades`) | ✅ HTTP 200 |

Não executados ainda nesta fase: `npm run test:e2e` (Playwright — sem cenários reais até a Fase 1+ existir fluxo autenticado), `npm audit fix` (adiado para não introduzir mudanças de dependência não justificadas antes da Fase 0 fechar).

## Validação Fase 1 (19/07/2026)

| Comando | Resultado |
|---|---|
| `npm run typecheck` | ✅ 0 erros |
| `npm run lint` | ✅ 0 erros, 1 warning cosmético (mesmo de antes) |
| `npm run test` | ✅ 1/1 |
| `npm run db:generate` | ✅ migração `0001_fine_ezekiel_stane.sql` (tabela `app_settings`) |
| `npm run db:migrate` | ✅ aplicada |
| `npm run build` | ✅ 39 rotas, todas as `/app/**` agora dinâmicas (checam sessão no servidor) |
| `npx playwright install --with-deps chromium` | ✅ |
| `npx playwright test` (chromium) | ✅ 6/6 — onboarding completo, login correto, login incorreto (mostra erro), logout + bloqueio de rota |
| `npx playwright test` (mobile, emulação Chromium/Pixel 7) | ⚠️ 5/6 — 1 teste esbarrou no rate limit de login (5 tentativas/60s) por rodar logo após a suíte chromium na mesma janela; comportamento correto do rate limiter, não é bug de produto. WebKit real não foi instalado (exigiria dezenas de libs de sistema via `sudo apt-get` numa VPS de produção compartilhada — ver `docs/decisoes-tecnicas.md`) |
| Verificação direta no banco (`audit_events`) | ✅ `auth.admin_created`, `onboarding.completed`, `auth.login_success` ×2, `auth.login_failed` ×3, `auth.logout` ×1 registrados com hash, ator e timestamp corretos |

Bugs encontrados e corrigidos durante a validação (não teóricos — só apareceram testando de verdade):
1. `authClient.forgetPassword` não existe nesta versão do better-auth (1.6.23); o método correto é `requestPasswordReset` (descoberto via inspeção de tipos, não documentação).
2. `NEXT_PUBLIC_APP_URL` fixo no `auth-client.ts` quebrava login quando a página era acessada por um host diferente do configurado (cross-origin same-server) — corrigido para usar a origem atual do navegador (sem `baseURL` fixo no client).
3. Better Auth rejeitava `trustedOrigins` não listados explicitamente — adicionado `trustedOrigins` derivado de `BETTER_AUTH_URL`/`APP_URL` + variantes `localhost`/`127.0.0.1` fora de produção.

## Validação Fase 2/3 parcial — Leads (19/07/2026)

| Comando | Resultado |
|---|---|
| `npm run typecheck` | ✅ 0 erros |
| `npm run lint` | ✅ 0 erros, mesmo warning cosmético |
| `npm run test` | ✅ 1/1 |
| `npm run db:generate` | ✅ migração `0002_shiny_groot.sql` (`leads`, `prospecting_lists`, `prospecting_items`) |
| `npm run db:migrate` | ✅ aplicada |
| `npm run build` | ✅ 40 rotas |
| `POST /api/public/forms/lead` (curl, fora de sessão) | ✅ persistiu de verdade — `LEAD-2026-0001` confirmado direto no Postgres |
| `npx playwright test` (chromium + mobile) | ✅ **15/15** — setup de autenticação compartilhada, login (certo/errado), logout, leads (criar/buscar/mudar status/converter), smoke |

Bugs reais encontrados e corrigidos durante a validação (não teóricos):
1. **Página de detalhe não atualizava após mudar status.** O update chegava no banco (confirmado via `psql`) mas a Server Component não revalidava. Causa: `<form action={...}>` chamando uma Server Action via `.bind()` não dispara o refresh automático do App Router de forma confiável nesse caso — corrigido com `revalidatePath()` explícito em toda mutação de `leads/actions.ts`.
2. **Nome do lead na listagem não era clicável** (só o ícone de seta era link) — corrigido envolvendo o nome em `<Link>`, mais descobrível.
3. **Suíte E2E esgotava o rate limit de login (5/60s)** ao rodar duas suítes de browser (chromium + mobile), cada uma logando várias vezes. Corrigido com o padrão oficial do Playwright: projeto `setup` loga uma vez e salva `storageState`; specs que testam o próprio login/logout sobrescrevem para estado deslogado. Reduz de ~8 tentativas de login por execução completa para 3.
4. **Logout não existia no mobile.** A Sidebar (onde ficava o botão "Sair") é `hidden` abaixo do breakpoint `lg`, e o menu inferior mobile não tinha equivalente — usuário em um celular não tinha como sair da conta pela interface. Corrigido adicionando um botão de logout na Topbar (visível em todas as telas, `lg:hidden` apenas para não duplicar na desktop).

Migração de estrutura ainda não feita (aviso não-bloqueante do Next 16): `middleware.ts` → `proxy.ts`. Ver `docs/decisoes-tecnicas.md`.

## Validação Fase 3 parcial — Contatos e Empresas (19/07/2026)

| Comando | Resultado |
|---|---|
| `npm run check` (typecheck+test+build) | ✅ 42 rotas, 0 erros |
| `npm run lint` | ✅ mesmo warning cosmético de sempre |
| `npx playwright test` (suíte completa, chromium + mobile) | ✅ **23/23** |

Sem migração nesta etapa — reaproveitou `companies`, `contacts` e `company_contacts` já existentes no schema herdado.

Bugs de teste corrigidos durante a validação (nenhum bug de produto desta vez):
1. `getByRole("alert")` colidia com o `role="alert"` do route announcer interno do Next.js — trocado por `getByText(...)` no conteúdo real da mensagem de erro.
2. `getByRole("button", { name: "Buscar" })` colidia com o botão de busca global da Topbar — precisou de `{ exact: true }`.
