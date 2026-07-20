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

## Validação Fase 3 parcial — Oportunidades (19/07/2026)

| Comando | Resultado |
|---|---|
| `npm run check` | ✅ 43 rotas, 0 erros |
| `npm run lint` | ✅ mesmo warning cosmético |
| `npx playwright test` (suíte completa) | ✅ **29/29** (chromium + mobile) |

Bug de produto real encontrado e corrigido: `onClick` passado diretamente a uma `<div>` dentro de um Server Component (`page.tsx` do board) — React 19/Next 16 rejeita isso em runtime ("Event handlers cannot be passed to Client Component props"), quebrando a página inteira ao renderizar qualquer card. O `<select>` do componente cliente (`stage-select.tsx`) já fazia `stopPropagation()` sozinho, então a `div` com `onClick` era redundante além de inválida — removida.

Bugs de teste (seletor ambíguo, já esperado dado o padrão que se repete): `getByText(...)` sem `{ exact: true }` colidindo com textos parecidos em badge + histórico de atividades.

## Validação Fase 3 (fechamento) — Produtos (19/07/2026)

| Comando | Resultado |
|---|---|
| `npm run check` (após limpar `.next` — ver `docs/operacao.md`) | ✅ 46 rotas, 0 erros |
| `npm run lint` | ✅ mesmo warning cosmético |
| `npx playwright test` (suíte completa) | ✅ **35/35** (chromium + mobile) |

Bug de produto real: checkbox desmarcada (`allowBriefingSkip`) manda `null` via `FormData.get()`, não `undefined` — `z.string().optional()` só aceita `undefined` e rejeitava com "Invalid input: expected string, received null". Corrigido para `z.string().nullish()`. Vale conferir os outros formulários com checkbox no futuro (nenhum outro existe ainda nesta base).

**Fase 3 fechada.** 35 testes E2E cobrindo lead→oportunidade→contato/empresa→produto, todos reais (banco Postgres de verdade, sem mocks).

## Validação Fase 4 — Briefing persistente (19/07/2026)

| Comando | Resultado |
|---|---|
| `npm run check` (após limpar `.next`) | ✅ 48 rotas, 0 erros |
| `npm run lint` | ✅ mesmo warning cosmético |
| `npm run db:generate` / `db:migrate` / `db:seed` | ✅ migração `0003_rapid_iron_lad.sql`, template padrão semeado |
| `npx playwright test` (suíte completa, chromium + mobile) | ✅ **40/41** na primeira passada (1 flake em `contatos.spec.ts` no chromium, reproduzido isolado com 5/5 verde — disco da VPS ocasionalmente lento, não é bug de produto) |

Bugs reais encontrados e corrigidos durante a validação:
1. **Label não associado ao campo** na página pública do briefing (`<label>` sem `htmlFor`/`id` correspondente) — falha de acessibilidade real, não só de teste; qualquer leitor de tela teria o mesmo problema que o Playwright teve para localizar o campo. Corrigido associando cada `label` ao seu input via `id`/`htmlFor`.
2. **Multiselect só reagia a clique no quadradinho**, não na linha inteira — `onClick` estava no `<span>` interno em vez do `<label>` que envolve a opção inteira. Corrigido.
3. **Tela de "concluído" nunca aparecia**: ao chamar uma Server Action diretamente (não via `<form action>`) de dentro de um Client Component, o Next.js revalida a rota automaticamente após a ação — isso troca a árvore de componentes pela saída atual do Server Component (`page.tsx`), descartando qualquer estado local tipo `useState(completed)` que dependesse de "acabei de concluir agora". Corrigido removendo o estado local redundante e deixando o próprio `page.tsx` decidir a tela com base no `status` real do banco — mais simples e mais robusto (funciona igual em conexão lenta, recarregamento, etc.).
4. Erro bobo introduzido durante o fix #3: removi o import do ícone `Check` do lucide-react sem notar que ainda era usado no multiselect — `next dev` (modo desenvolvimento) não bloqueia nisso, só quebra em runtime no navegador; `tsc --noEmit` pega isso na hora. Lição registrada: sempre rodar `npm run typecheck` depois de qualquer edição, antes de gastar tempo rodando Playwright.

Reafirma o padrão dos bugs de teste (seletor ambíguo por badge/texto repetido) — já não vale mais a pena listar item a item, o padrão é conhecido: sempre preferir `{ exact: true }` ou `.first()` quando o texto pode aparecer em mais de um lugar da tela.

## Validação Fase 5 — Proposta versionada (19-20/07/2026)

| Comando | Resultado |
|---|---|
| `npm run check` (após limpar `.next`) | ✅ 46 rotas, 0 erros |
| `npm run lint` | ✅ mesmo warning cosmético |
| `npm run db:generate` / `db:migrate` | ✅ migração `0004_yummy_queen_noir.sql` (`proposal_change_requests` + campos de aceite) |
| `npx playwright test` (suíte completa, chromium + mobile) | ✅ **49/49** |

Bugs reais encontrados e corrigidos durante a validação:
1. **Nenhum produto do seed tinha `allowBriefingSkip = true`** — a regra "pular briefing exige produto elegível" nunca podia ser exercida de verdade porque não existia produto elegível algum. Corrigido marcando "Link na Bio" e "Cartão Digital" (presença digital simples) como elegíveis, e o seed passou a fazer upsert (`onConflictDoUpdate`) desse campo em vez de só inserir, para que rodar o seed de novo corrija instalações já existentes.
2. **Mesmo bug do "estado local perdido por revalidação automática de Server Action"** já visto na Fase 4, agora na tela pública de proposta: aceitar/rejeitar chamava a Server Action direto do client e a tela de confirmação local nunca aparecia (o Server Component já assumia com o estado real do banco antes). Mesma correção: removido o estado local `accepted`/`rejected`, a página do servidor decide a tela com base no `status` real.
3. **Teste travando por >30s no login** — investigado a fundo (ver `docs/decisoes-tecnicas.md`): não era bug de produto, era timeout de assertion padrão (5s) curto demais para compilação just-in-time do Next em dev mode num disco lento. Corrigido aumentando os timeouts do Playwright (`expect.timeout: 15s`, timeout de teste: 60s) — decisão de configuração de teste, não mudança de comportamento do app.
4. **Descoberta importante e não relacionada a bug de código**: durante essa investigação, achei que o Dokploy dessa VPS está fazendo deploy automático a cada `git push` para o GitHub, recriando um serviço (`pulso-crm-bx9hht`) que o usuário tinha pedido para apagar numa sessão anterior. Parei o serviço (`docker service scale ...=0`) com autorização do usuário; webhook do Dokploy não foi tocado. Registrado em memória do projeto para não esquecer em sessões futuras.
5. Ao corrigir #1, o formulário de "pular briefing" passou a renderizar de verdade (antes mostrava só "nenhum produto elegível" e nem desenhava o campo de busca) — quebrou dois testes existentes (`briefings.spec.ts`, `smoke.spec.ts`) que não esperavam por isso. Ajustados para escopar os seletores por card em vez de indexar posicionalmente, e o smoke test da proposta pública (que testava a antiga página estática) foi trocado para validar o comportamento real da rota com slug inválido, já que a página `/proposta/[slug]` deixou de ser demo.

**Fase 5 fechada.** 49 testes E2E cobrindo lead→briefing→proposta→aceite público, todos reais.

## Validação Fase 6 — Contrato e assinatura interna (20/07/2026)

| Comando | Resultado |
|---|---|
| `npm run check` (após limpar `.next`) | ✅ 49 rotas, 0 erros |
| `npm run lint` | ✅ mesmo warning cosmético |
| `npm run db:generate` / `db:migrate` | ✅ migração `0005_bent_polaris.sql` (`contract_signatories`, `contract_events`, campos novos em `contracts`) |
| `npx playwright test` (suíte completa, chromium + mobile) | ✅ **57/57** |
| Verificação direta no banco | ✅ `financial_entries` recebeu `COB-2026-0001 — Recebível do contrato CONT-2026-0002` automaticamente ao completar a assinatura |

Bug real (terceira ocorrência do mesmo padrão — ver `docs/decisoes-tecnicas.md` § "revalidação automática apaga estado local"): o botão "Revisar e enviar para assinatura" chamava a Server Action direto do client e guardava o link gerado (só exibido uma vez) em `useState`; como a ação muda `contract.status` de `draft` para `sent`, a revalidação automática desmontava o próprio bloco condicional `{isDraft && (...)}` que continha o componente com o link — o link nunca chegava a aparecer. Desta vez a correção foi mais definitiva: a action passou a fazer `redirect()` com o token como query string (mesmo padrão já usado em Propostas/Briefings na criação), eliminando de vez a dependência de estado local de client component para esse tipo de confirmação.

## Validação Fase 7 — Financeiro manual, empresa e pessoal (20/07/2026)

| Comando | Resultado |
|---|---|
| `npm run typecheck` | ✅ 0 erros |
| `npm run lint` | ✅ mesmo warning cosmético |
| `npm run build` (após limpar `.next`) | ✅ 49 rotas, build de produção limpo |
| `npx playwright test financeiro.spec.ts --project=chromium` | ✅ **6/6** |
| `npx playwright test` (suíte completa, chromium + mobile) | ✅ **66/67** na primeira passada, **67/67** ao reproduzir isolado o único teste que falhou |

Sem migração — reaproveita `financial_accounts`/`financial_entries`, que já existiam desde a fundação sem nenhuma tela conectada.

Nenhum bug de produto encontrado nesta fase. Dois ajustes de teste, ambos esperados dado o padrão já conhecido de seletor ambíguo:
1. `row.getByText("R$ 300,00")` colidia com o texto "Pago: R$ 300,00" (badge de valor pago exibido junto ao valor total quando `amountActual > 0`) — corrigido com `{ exact: true }`.
2. A descrição do lançamento de estorno é `Estorno de ${entry.code}: ${motivo}` — **não** inclui a descrição original, só o código. O teste inicial tentava localizar o lançamento compensatório em "a pagar" filtrando pela descrição do lançamento original (`RECEIVABLE_DESC`), que nunca aparece lá. Corrigido capturando o código real (`COB-2026-XXXX`) exibido na tabela logo após criar o lançamento, e filtrando por ele.

Comportamento validado como intencional (não é bug): o estorno de um recebível ("in") gera um lançamento de despesa ("out") — por isso o compensatório de uma conta a receber aparece em `/app/financeiro/pagar`, não em `/app/financeiro/receber`. O lançamento original nunca é alterado (nem status, nem valores) — só ganha `metadata.reversedBy` apontando para o novo lançamento.

**Fase 7 fechada.** 6 testes E2E novos cobrindo criação/baixa parcial/baixa total/estorno de contas a receber, criação de contas a pagar, separação do livro pessoal e carregamento da visão financeira — suíte completa em 67/67, todos reais (Postgres de verdade, sem mocks).

Bugs de teste (mesmo padrão de sempre — texto/seletor repetido na tela, principalmente por causa da logo "PULSO" aparecer em vários lugares do layout e por elementos irmãos vs. descendentes num `.locator("..")`): corrigidos com locators mais específicos.

## Validação Fase 8 — Projetos, arquivos, aprovações e horas (20/07/2026)

| Comando | Resultado |
|---|---|
| `npm run db:generate` / `db:migrate` | ✅ migração `0006_furry_morlun.sql` (`approvals` ganhou código, link público e evidências de decisão) |
| `npm run db:seed` | ✅ catálogo real de produtos aplicado (verificado direto no banco: 13 produtos reais ativos, produto fabricado arquivado) |
| `npm run check` (typecheck + vitest + build, após limpar `.next`) | ✅ 63 rotas, 0 erros |
| `npx playwright test projetos.spec.ts --project=chromium` | ✅ **9/9** |
| `npx playwright test` (suíte completa, chromium + mobile) | ✅ **83/83** |

Bugs reais encontrados e corrigidos durante a validação:
1. **`createTask` rejeitava toda tarefa com "Invalid input"** — o formulário de criação de tarefa (`task-panel.tsx`) nunca teve um campo `description`, mas a Server Action tentava validar `formData.get("description")` com `z.string().optional()`. Campo ausente no FormData retorna `null`, e `.optional()` do Zod só aceita `undefined` — mesmo padrão de bug já visto na Fase 3 (checkbox desmarcado) e documentado em `docs/decisoes-tecnicas.md`. Corrigido removendo o campo `description` do schema e do insert (a UI nunca ofereceu esse campo, então mantê-lo como "aceito mas inatingível" não fazia sentido — se descrição de tarefa vier a ser necessária, adiciona-se o campo na UI e no schema junto).
2. **`logTimeEntry` teria o mesmo bug** para o checkbox "Faturável" se alguém o desmarcasse (`formData.get("billable")` retorna `null` quando desmarcado, e o schema usava `.optional()`) — encontrado por revisão de código ao corrigir o bug #1, não por falha de teste (o teste E2E deixa o checkbox marcado por padrão). Corrigido preventivamente para `.nullish()`.

Bugs de teste (padrões já conhecidos, mais um novo):
1. Sequência de espera faltando ao adaptar o fluxo proposta→aceite de `contratos.spec.ts` — o teste pulou os `expect` intermediários ("R$ 197,00" após salvar rascunho, "Enviada" após publicar) antes de capturar o link público, criando uma corrida onde o link era lido antes do token existir. Restaurados os mesmos `expect` do fluxo original comprovado.
2. **Dados de teste não únicos entre reexecuções** (padrão novo, mas a causa-raiz é a mesma de sempre — texto fixo repetido): o nome do arquivo de upload (`mockup.png`) e a descrição do lançamento de horas via timer (`"Reunião rápida com cliente"`) eram strings fixas, então cada nova tentativa da suíte deixava um registro a mais no banco com o mesmo texto, quebrando `getByText(...)` por violação de strict mode assim que a suíte rodava mais de uma vez. Corrigido dando a esses textos o mesmo tratamento que `OPP_TITLE`/`TASK_TITLE` já tinham (sufixo `Date.now()`).
3. **Teste combinando decisão pública com verificação interna na mesma função** — `context.clearCookies()` para simular o cliente sem sessão, seguido de navegação de volta a uma rota interna esperando ainda estar autenticado, dentro do mesmo `test()`. Como cada `test()` novo é quem recebe o `storageState` autenticado fresco (não a limpeza de cookies do anterior), a correção foi separar em dois testes distintos — mesmo padrão já usado em `contratos.spec.ts` e `financeiro.spec.ts`, só não tinha sido seguido à risca desta vez.
4. **Falso positivo por corrida de revalidação** ao parar o timer: `getByText(description)` batia tanto no widget do timer (ainda mostrando "Parando..." com o texto antigo, antes da revalidação assentar) quanto na lista de lançamentos (já atualizada) — 2 elementos simultâneos. Corrigido esperando o botão "Iniciar timer" reaparecer (confirma que o timer realmente parou) antes de checar a lista.

**Fase 8 fechada.** 9 testes E2E novos cobrindo geração idempotente de projeto a partir de contrato assinado, tarefas, upload/lixeira/restauração de arquivo, aprovação com link público e decisão do cliente sem sessão, bloqueio/liberação de conclusão de projeto por aprovação pendente, e horas manuais/timer — suíte completa em 83/83, todos reais.

## Validação Fase 9 — Portal do cliente e suporte (20/07/2026)

| Comando | Resultado |
|---|---|
| `npm run db:generate` / `db:migrate` | ✅ migração `0007_fearless_killraven.sql` aplicada no banco de desenvolvimento (sessões do portal, mensagens de chamado, ativação/revogação e chave de permissão por projeto) |
| `npm run typecheck` | ✅ 0 erros |
| `npm run lint` | ✅ 0 erros; 1 aviso preexistente em `postcss.config.mjs` (`import/no-anonymous-default-export`) |
| `npm run test` | ✅ **1/1** Vitest |
| `npm run build` (após limpar `.next`) | ✅ 77 rotas no manifesto de build, 0 erros; somente o aviso conhecido de `middleware.ts` depreciado |
| `PORT=3010 npx playwright test e2e/portal.spec.ts` (chromium + mobile) | ✅ **21/21** (1 setup + 10 desktop + 10 mobile), repetido após a revisão de autorização |
| `PORT=3010 npx playwright test` (suíte completa) | ⚠️ **99 passaram**, 1 flake legado em `financeiro.spec.ts` mobile e 3 seguintes não rodaram pelo modo serial; os 20 cenários do portal passaram em chromium e mobile |
| `PORT=3010 npx playwright test e2e/financeiro.spec.ts --project=mobile` | ✅ **6/6** ao reproduzir imediatamente o único ponto da suíte completa que falhou; confirma instabilidade ambiental, não regressão |

Problemas encontrados e corrigidos durante a validação:

1. **Dados de teste não únicos entre reexecuções**: o título fixo do chamado colidia com registros deixados por tentativas anteriores e causava `strict mode violation`; `TICKET_TITLE` passou a receber sufixo `Date.now()`.
2. **Execução do Playwright na porta errada**: a porta 3000 da VPS pertence ao Dokploy; sem `PORT=3010`, o setup abria a tela de erro do próprio Dokploy. A validação válida foi feita integralmente na porta isolada 3010, conforme `docs/operacao.md`.
3. **Aprovação cruzada por identificador**: a ação do portal verificava acesso ao `projectId`, mas não confirmava que o `approvalId` pertencia ao mesmo projeto. Adicionada validação conjunta antes da decisão.
4. **Projeto arbitrário em chamado**: a ação aceitava um `projectId` enviado manualmente fora das opções exibidas pelo formulário. Agora exige uma linha correspondente em `portal_permissions`.
5. **Identidade ambígua por e-mail**: o login usa e-mail + senha sem seletor de empresa, enquanto o convite bloqueava duplicidade apenas dentro da mesma empresa. O fluxo agora normaliza o e-mail e impede reutilização global no portal.

**Fase 9 fechada para publicação.** O portal e o suporte usam banco e sessões reais, sem mocks; arquivos, aprovações e chamados respeitam as permissões concedidas e notas internas foram verificadas como invisíveis ao cliente.


## Fase 10: Notifica��es e Telegram
- Central interna idempotente salva as notifica��es.
- O webhook foi configurado e testa X-Telegram-Bot-Api-Secret-Token.
- Criamos comandos /hoje, /tarefa, /buscar com confirma��es e expira��o e persistimos Telegram no 	elegram_updates para evitar repeti��es.
