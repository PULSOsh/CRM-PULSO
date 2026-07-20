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

## 19/07/2026 — Schema expandido sob demanda, não em lote antecipado

A seção 7 do prompt mestre lista ~80 tabelas (identidade/portal, templates/documentos, projetos/operação, financeiro empresa/pessoal, plataforma) como escopo da "Fase 2 — banco e domínio", antes de qualquer CRUD começar.

**Decisão:** o schema cresce junto com cada funcionalidade que realmente vai usá-lo, não antecipadamente. Ao iniciar a Fase 3 (CRM comercial), a única lacuna real bloqueando o trabalho era a ausência de `leads` e `prospecting_lists`/`prospecting_items` — o resto do que a seção 7 pede (templates de proposta, signatários, etapas de projeto, contas a pagar, webhooks recebidos, chaves de idempotência, consentimento LGPD, etc.) não tem nenhuma tela ou fluxo consumindo ainda.

**Por quê:** desenhar dezenas de tabelas para funcionalidade que não existe é abstração prematura — na prática, o formato exato de cada tabela só fica claro quando a regra de negócio correspondente é implementada e testada de verdade (ex.: só ao construir propostas versionadas vai ficar claro se `proposal_items` precisa de uma coluna de desconto por item ou só um desconto agregado). Migrações incrementais, uma por funcionalidade, com nome descritivo, são mais fáceis de revisar e de reverter do que uma migração gigante especulativa.

**Como isso não vira desculpa para pular tabela**: cada fase do roadmap (`docs/progresso.md` § "Próxima sequência recomendada") lista explicitamente quais entidades de `docs/banco-de-dados.md` § "Próximas tabelas a implementar" ela cobre, e a tabela só é considerada implementada quando tem migração aplicada **e** CRUD/fluxo real usando ela — nunca schema "para o futuro" sem consumidor.

## 19/07/2026 — Aviso "middleware deprecated" do Next.js 16 (não corrigido ainda)

O Next.js 16.2 avisa que o arquivo `middleware.ts` será renomeado para `proxy.ts` numa convenção futura (`https://nextjs.org/docs/messages/middleware-to-proxy`). Ainda funciona normalmente (é só aviso, não erro), então não foi migrado agora para não introduzir risco fora do escopo da Fase 1. Pendência de baixo risco para revisar numa fase de polimento (Fase 11).

## 20/07/2026 — Padrão "revalidação automática apaga estado local" em Server Actions chamadas direto do client

Apareceu duas vezes (Fase 4, briefing público; Fase 5, proposta pública): um Client Component chama uma Server Action diretamente (não via `<form action={fn}>`, via `onClick` + `await fn()`), a ação muda o `status` de um registro no banco, e a tela de confirmação local (`useState` tipo `completed`/`accepted`) nunca chega a aparecer — o Next.js App Router revalida a rota automaticamente depois que uma Server Action é chamada a partir de um Client Component, o que faz o Server Component pai (`page.tsx`) re-renderizar com o estado real do banco, substituindo a árvore antes do `setState` local ter qualquer efeito visível.

**Decisão (regra geral para o resto do projeto):** nunca depender de estado local de Client Component para mostrar "acabei de fazer X com sucesso" quando X muda um status que o Server Component pai também usa para decidir o que renderizar. Em vez disso, deixar o Server Component ser a única fonte de verdade da tela — a revalidação automática já cuida de mostrar o estado atualizado. Vale para as próximas fases: aceite de contrato, confirmação de pagamento, aprovação de entrega, etc. — qualquer ação pública que muda status e é chamada direto do client vai ter esse mesmo comportamento.

## 20/07/2026 — Timeouts do Playwright aumentados (dev mode compila rotas sob demanda)

Um teste ficava preso por >30s no clique de login, com "[Fast Refresh] rebuilding" aparecendo no meio do fluxo. Investigação (incluindo suspeita de container concorrente — ver decisão seguinte) descartou causas externas: o log do servidor mostrava o `POST /api/auth/sign-in/email` retornando `200` normalmente. O problema era simplesmente que a timeout padrão do `expect()` do Playwright (5s) é curta demais para a primeira navegação a uma rota que o `next dev` ainda não compilou (compilação just-in-time), especialmente no disco mais lento da VPS de testes (avisos recorrentes de "Slow filesystem detected").

**Decisão:** `playwright.config.ts` ganhou `expect: { timeout: 15_000 }` e `timeout: 60_000` (timeout por teste) no nível raiz do config. Isso é puramente uma folga para o custo de dev mode — `next start`/produção não tem esse problema porque as rotas já vêm pré-compiladas do build.

## 20/07/2026 — Dokploy redeploya `pulso-crm-bx9hht` a cada `git push`, mesmo após reset anterior

Durante a investigação do timeout acima, encontrei um processo `next-server` (dentro de um container Docker, `cwd=/app/apps/web`) rodando havia 3 horas na mesma VPS. `docker ps -a --filter name=pulso-crm` revelou um serviço Swarm `pulso-crm-bx9hht` "Up 3 hours", com `/etc/dokploy/applications/pulso-crm-bx9hht/code/` contendo o código deste mesmo repositório (`docs/decisoes-tecnicas.md`, `docs/operacao.md` — arquivos criados nesta sessão). Ou seja: o Dokploy tem um webhook conectado ao GitHub `PULSOsh/CRM-PULSO` e faz build+deploy automático a cada push — o mesmo serviço que o usuário tinha pedido para apagar por completo numa sessão anterior (ver memória `pulso-crm-v2-state`) voltou a existir como efeito colateral dos pushes desta sessão, sem que ninguém tivesse configurado isso de propósito nesta conversa.

**Decisão, com autorização explícita do usuário:** `docker service scale pulso-crm-bx9hht=0` — para o container, sem apagar o serviço nem mexer na configuração do webhook no Dokploy. Detalhes completos (incluindo o `BETTER_AUTH_SECRET` fraco que esse deploy usa) registrados na memória de projeto `dokploy-autodeploy-webhook`, para não ser esquecido em sessões futuras — qualquer novo `git push` para esse repositório pode reativá-lo.

## 20/07/2026 — Recebível criado automaticamente ao assinar contrato, antes da Fase 7 existir

A regra de negócio é explícita: "contrato assinado prepara recebíveis, mas não envia cobrança automaticamente" (`docs/regras-de-negocio.md`). A tabela `financial_entries` já existia desde a fundação da base, sem nenhuma tela ou fluxo usando ela ainda (Fase 7 é quem constrói a gestão de contas a receber/pagar).

**Decisão:** em vez de esperar a Fase 7 para fechar esse elo do fluxo principal (`docs/briefing-final.md` §18 exige o ciclo completo até "pagamento"), a finalização da assinatura (`finalizeContractIfAllSigned`, `apps/web/src/lib/contract-helpers.ts`) já insere um lançamento `pending` em `financial_entries`, com `metadata.contractId` apontando de volta para o contrato (a tabela não tem uma coluna `contractId` dedicada — adicionar isso é trabalho da Fase 7, quando o modelo financeiro completo for desenhado). A Fase 7 vai construir a UI para listar, dar baixa, estornar esses lançamentos — o registro em si já existe e é consultável via SQL/Drizzle Studio antes disso.

**Por quê:** um recebível "invisível" (existe no banco, mas nenhuma tela mostra) ainda é melhor que nenhum recebível — preserva a regra de negócio e os dados ficam corretos desde já, sem exigir uma segunda migração/backfill quando a Fase 7 chegar.

## 20/07/2026 — Upload/download de arquivos privados conectado pela primeira vez

Desde a fundação, `packages/storage` tinha um adapter `LocalPrivateStorage` completo (hash SHA-256, nome aleatório, permissão `0600`, lixeira) mas **nenhuma rota HTTP o usava** — `docs/progresso.md` documentava isso honestamente como pendência ("rotas de upload e download ainda precisam ser conectadas").

**Decisão:** a Fase 6 precisava disso de qualquer forma (upload de contrato assinado externamente), então implementei `POST /api/files` e `GET /api/files/[id]` de forma genérica (aceitam `entityType`/`entityId` opcionais para vincular a qualquer entidade — não só contratos), autenticados, gravando metadados em `files`. Deliberadamente **não** implementei controle de acesso por entidade/visibilidade ainda (ex.: um usuário do portal só poder baixar arquivos do próprio projeto) — isso é trabalho da Fase 9 (portal), que vai precisar de um modelo de permissão mais rico do que "autenticado = pode baixar qualquer coisa". Por ora, é internal-only por design (todas as rotas exigem sessão do Better Auth), o que é seguro para o único administrador interno mas não seria suficiente quando usuários de portal existirem.

## 20/07/2026 — Terceira ocorrência do padrão "revalidação apaga estado local"; correção definitiva

Documentado nas Fases 4 e 5 (ver decisões acima), o mesmo bug apareceu de novo no botão de enviar contrato: dessa vez não era só o estado sumir, era o **componente inteiro desmontar** porque a condição `{isDraft && <SendContractButton />}` no Server Component pai deixava de ser verdadeira assim que a Server Action mudava `status` para `sent`.

**Decisão final para o padrão**: qualquer ação que (a) muda um status que o Server Component usa para decidir o que renderizar, **e** (b) precisa mostrar um segredo que só existe uma vez (token de link público), deve fazer a Server Action terminar com `redirect()` incluindo o segredo como query string, nunca depender de `useState` no client. É exatamente o padrão que Briefings e Propostas já usavam para a criação; Contratos só precisou do mesmo tratamento também para o envio. Registrado aqui como a solução padrão a copiar em qualquer fluxo futuro parecido (ex.: portal do cliente, Fase 9).
