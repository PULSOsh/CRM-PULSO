# Decisões técnicas

Registro de decisões, trade-offs e desvios da base original. Ordem cronológica.

## 19/07/2026 — Ambiente de desenvolvimento na VPS, não local

**Contexto:** a máquina de desenvolvimento (Windows) não tinha Docker instalado. Havia um serviço PostgreSQL 17 local, mas iniciar o serviço exigia privilégio administrativo indisponível na sessão.

**Decisão:** todo o ciclo de Fase 0 em diante (`npm install`, banco, migrações, build, testes) roda na VPS `pulso@191.96.251.124`, via SSH, numa pasta isolada `~/pulso-crm-app`. O código-fonte continua sendo editado localmente em `D:\PULSO\PULSO_CRM_NOVA_BASE\pulso-crm` e sincronizado para a VPS via `scp`.

**Por quê:** a VPS já tinha Docker, Node 20 e acesso `sudo` sem senha configurados, então validar ali era mais rápido e mais fiel ao ambiente de produção do que resolver permissões locais no Windows.

**Cuidados aplicados:**
- A VPS é compartilhada com outros serviços em produção (Dokploy, `pulso-oficial`, `pulso-catalogo-vendas`, `opticoredb`, etc.). O Postgres de desenvolvimento do PULSO CRM roda em container próprio (`pulso-crm-app-db-1`), volume próprio (`pulso-crm-app_pulso_pgdata`), sem tocar nos bancos de outras aplicações.
- A porta 3000 do host já está ocupada pelo Dokploy. O `docker-compose.yml` versionado no repositório mantém `3000:3000` (padrão correto para deploy real atrás de proxy dedicado); localmente na VPS, durante testes, a porta do host foi remapeada para `3010` apenas na cópia de trabalho remota — isso **não** está commitado no repositório.
- Antes de instalar/buildar, o disco da VPS estava em 98% de uso. Com autorização explícita do usuário, foi executado `docker system prune -a` (mais `docker builder prune`), liberando ~60 GB de imagens e cache órfãos de deploys antigos. Nenhum container ou volume em uso foi afetado.

**Implicação para sessões futuras:** antes de rodar comandos, confirmar que a pasta `~/pulso-crm-app` na VPS ainda existe e está sincronizada com o estado local mais recente (o fluxo normal é: editar local → `scp` para a VPS → rodar comandos via SSH). Se o Docker Desktop for instalado localmente no futuro, o fluxo pode migrar de volta para a máquina local sem mudanças no código.

## 19/07/2026 — Migração `0000_equal_gravity.sql` gerada a partir do schema inicial

Schema herdado da fundação (29 tabelas: identidade/Better Auth, CRM núcleo, comercial documental, operação, financeiro, plataforma) migrado como está, sem alterações, para validar a Fase 0. A expansão do schema (tabelas complementares listadas em `docs/banco-de-dados.md` §"Próximas tabelas a implementar") é trabalho da Fase 2 e gerará migrações incrementais adicionais — nunca `db:push` destrutivo.

## 19/07/2026 — Criação do administrador via `internalAdapter`, não pela rota pública de sign-up

O Better Auth desativa a rota pública `/sign-up/email` em produção (`disableSignUp: true`), o que é correto para impedir cadastro aberto. Só que a regra de negócio "administrador interno único" (`docs/regras-de-negocio.md`) precisa de um jeito de criar essa primeira conta mesmo assim, de forma controlada.

**Decisão:** o onboarding (`apps/web/src/app/(auth)/onboarding/actions.ts`) cria o administrador chamando diretamente `(await auth.$context).internalAdapter.createUser(...)` + `.linkAccount(...)` — a mesma API interna que o Better Auth usa por baixo dos panos — em vez de `auth.api.signUpEmail`. Isso contorna a restrição de sign-up público sem reabri-la, e o próprio server action já garante que só funciona enquanto a tabela `user` estiver vazia (`select ... from user limit 1`).

**Por quê:** é o padrão documentado pelo próprio Better Auth para scripts de seed de administrador. Alternativas descartadas: (a) deixar `disableSignUp` condicional a "zero usuários" — mais frágil, pois a rota pública ficaria temporariamente aberta a qualquer requisição externa até o primeiro cadastro; (b) pedir para o operador rodar um script CLI separado — pior UX, o onboarding web já é o fluxo pedido no prompt mestre (seção 8).

## 19/07/2026 — `authClient` sem `baseURL` fixo (usa a origem atual da página)

Erro real encontrado ao testar login com Playwright: `auth-client.ts` tinha `baseURL: process.env.NEXT_PUBLIC_APP_URL` (compilado como `http://191.96.251.124:3010`). Ao acessar a aplicação por `http://127.0.0.1:3010` (como o Playwright faz, e como qualquer proxy/túnel local faria), o client tentava falar com um host diferente do que serviu a página — Better Auth rejeitava (`Invalid origin`) e o login travava sem erro visível ao usuário (a Promise não resolvia de forma útil).

**Decisão:** `createAuthClient()` sem `baseURL`, deixando o SDK usar a origem do `window.location` atual. Como o Better Auth roda como Route Handler dentro do mesmo app Next.js (`/api/auth/[...all]`), isso é sempre same-origin, em qualquer domínio/porta/ambiente (dev, VPS por IP, produção com domínio próprio) — não precisa mudar em cada deploy.

Complementarmente, `auth.ts` no servidor ganhou `trustedOrigins` incluindo `BETTER_AUTH_URL`/`APP_URL` e, fora de produção, `http://localhost:<PORT>` e `http://127.0.0.1:<PORT>` (mesma porta configurada), para permitir desenvolvimento local e testes E2E sem enfraquecer a proteção de origem em produção.

## 19/07/2026 — Emulação mobile do Playwright via Chromium, não WebKit real

`devices["iPhone 13"]` usa o motor WebKit por padrão. Instalá-lo na VPS exigiria `sudo apt-get install` de ~15 bibliotecas de sistema (libwebp, libmanette, libenchant, etc.) numa máquina de produção compartilhada com outros serviços — risco desproporcional ao benefício nesta fase. Trocado para `devices["Pixel 7"]` (viewport e user-agent mobile, motor Chromium, já instalado). Se a fidelidade real do Safari/iOS se tornar necessária (ex.: bug específico de WebKit), reavaliar instalando WebKit num ambiente de CI isolado, não nesta VPS.

## 19/07/2026 — Aviso "middleware deprecated" do Next.js 16 (não corrigido ainda)

O Next.js 16.2 avisa que o arquivo `middleware.ts` será renomeado para `proxy.ts` numa convenção futura (`https://nextjs.org/docs/messages/middleware-to-proxy`). Ainda funciona normalmente (é só aviso, não erro), então não foi migrado agora para não introduzir risco fora do escopo da Fase 1. Pendência de baixo risco para revisar numa fase de polimento (Fase 11).
