# Operação

## Ambiente de desenvolvimento atual

Enquanto a máquina de desenvolvimento local não tiver Docker, o ciclo de desenvolvimento roda na VPS (ver `docs/decisoes-tecnicas.md`).

```bash
# sincronizar código local -> VPS
scp -i "$HOME/.ssh/pulso_vps" -r "D:\PULSO\PULSO_CRM_NOVA_BASE\pulso-crm\<pasta-alterada>" pulso@191.96.251.124:~/pulso-crm-app/<pasta-alterada>

# executar comandos
ssh -i "$HOME/.ssh/pulso_vps" pulso@191.96.251.124 "cd ~/pulso-crm-app && npm run typecheck && npm run test"
```

Banco de desenvolvimento: container `pulso-crm-app-db-1` (Postgres 17, porta 5432 do host da VPS), isolado dos demais serviços. Subir com `docker compose up -d db` dentro de `~/pulso-crm-app`.

## Rotina de atualização

1. Editar código localmente.
2. Sincronizar para a VPS.
3. `npm run typecheck && npm run lint && npm run test`.
4. Gerar/aplicar migrações se o schema mudou (`npm run db:generate && npm run db:migrate`).
5. `npm run build`.
6. Trazer migrações geradas de volta para o repositório local (`packages/database/drizzle/`).
7. Atualizar `docs/progresso.md` e `docs/validacao.md`.

## Backup (rotina recomendada, a automatizar na Fase 11)

- `pg_dump` diário do banco `pulso_crm`.
- Cópia do volume `pulso_files` (armazenamento privado) separada do banco.
- Retenção: 14 diários, 8 semanais, 12 mensais.
- Cópia fora da VPS principal, criptografada.
- Teste de restauração periódico.

## Gestão de integrações

Todas desativadas por padrão (`EMAIL_PROVIDER=dev`, `TELEGRAM_ENABLED=false`, `AI_PROVIDER=disabled`, `SIGNATURE_PROVIDER=internal`, `PAYMENT_PROVIDER=manual`, `GOOGLE_CALENDAR_ENABLED=false`). Nenhuma é requisito de inicialização — o CRM deve operar 100% manualmente sem elas.

## Deploy de produção (crm.pulsosh.cloud, via Dokploy)

O ambiente de dev/teste (`~/pulso-crm-app` na VPS, seção acima) é **separado** do deploy de produção. Produção roda sob o Dokploy, que já auto-redeploya a aplicação `pulso-crm-bx9hht` a cada `git push` em `origin/master` (webhook configurado no GitHub, fora do controle deste repositório — ver `docs/decisoes-tecnicas.md` e a memória de projeto `dokploy-autodeploy-webhook`). Isso é **intencional** desde 20/07/2026: cada fase fechada e enviada para o `master` já fica disponível em `https://crm.pulsosh.cloud` minutos depois, sem passo manual.

### Como o Dokploy está montado

- App: projeto **Pulso** → aplicação **crm** (`applicationId` fica salvo na configuração do Dokploy; nome do serviço Docker é `pulso-crm-bx9hht`, source type `github`, build `nixpacks`, branch `master`).
- Domínio: `crm.pulsosh.cloud`, HTTPS via Let's Encrypt, porta interna 3000 — DNS já aponta pra VPS desde antes da Fase 8.
- Banco de produção: serviço Postgres próprio provisionado dentro do Dokploy (nome interno real tem sufixo aleatório gerado pelo Dokploy, ex. `pulso-postgres-<sufixo>` — **nunca assumir que é literalmente `pulso-postgres`**, sempre conferir via `docker service ls | grep postgres` ou pela API antes de configurar `DATABASE_URL`). Banco `pulsodb`, totalmente separado do banco de dev/teste (`pulso_crm`).
- Segredos (`DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`) ficam salvos na configuração do Dokploy (não em arquivo `.env` do repositório) — editar via API ou painel, nunca via `docker service update` direto (não persiste: o Dokploy reaplica sua própria config salva a cada redeploy, sobrescrevendo qualquer mudança feita só no container em execução).

### API do Dokploy

Acessível localmente na própria VPS em `http://localhost:3000/api/...`, autenticada por header `x-api-key`. Descoberta útil de endpoints (retornam erro de validação do Zod listando os campos exigidos quando chamados com `{}`, isso é intencional e serve pra descobrir o schema sem documentação):

| Ação | Endpoint | Observação |
|---|---|---|
| Listar projetos/apps | `GET /api/project.all` | única forma encontrada de descobrir `applicationId` pelo nome |
| Ver config completa do app | `GET /api/application.one?applicationId=...` | inclui `env` (string multi-linha `CHAVE=valor`), `domains`, etc. |
| Atualizar env/config do app | `POST /api/application.update` | `{ applicationId, env: "<string completa>" }` — **substitui o `env` inteiro**, sempre ler o atual primeiro e só trocar a linha necessária |
| Rebuildar e redeployar (git pull + build + restart) | `POST /api/application.deploy` | `{ applicationId }` — demora ~2min (clone + npm i + build), acompanhar pelo log em `/etc/dokploy/logs/<appName>/<appName>-<timestamp>.log` |
| Só reiniciar o container (sem rebuild, pega env novo) | `POST /api/application.reload` | `{ applicationId, appName }` — muito mais rápido que `deploy`, usar quando só o `env` mudou e o código não |
| Criar banco Postgres gerenciado | `POST /api/postgres.create` | exige `name`, `databaseName`, `databaseUser`, `databasePassword`, `environmentId` (pegar de `project.all`) |
| Subir o banco criado | `POST /api/postgres.deploy` | `{ postgresId }` |
| Forçar regeneração da rota do Traefik pro domínio | `POST /api/domain.update` | reenviar os mesmos dados de um domínio já existente (`domainId`, `host`, `port`, etc.) — foi o que resolveu um 404 mesmo com o domínio já cadastrado no banco do Dokploy, porque o arquivo `/etc/dokploy/traefik/dynamic/<appName>.yml` nunca tinha sido gerado |

Chamadas com corpo JSON: **sempre escrever o payload num arquivo e usar `curl -d @arquivo.json`**, nunca JSON inline na string do comando SSH — o encadeamento PowerShell → SSH → bash → curl mastiga aspas de forma imprevisível e ou falha silenciosamente ou (pior) o PowerShell interpreta parte do comando localmente. Mesma lógica de "escrever em arquivo e copiar" já vale para os SQLs de diagnóstico contra o Postgres do próprio Dokploy (acessível via `docker exec <container-do-dokploy-postgres> psql -U dokploy -d dokploy -f /caminho/arquivo.sql`).

### Rodar migração/seed contra o banco de produção

O container de produção é buildado a partir do monorepo inteiro (Nixpacks copia tudo, não é um build multi-stage enxuto) — `packages/database` e `node_modules` completos estão disponíveis dentro dele. Não precisa de nenhum passo especial:

```bash
CONTAINER_ID=$(sudo docker ps -qf name=pulso-crm-bx9hht)
sudo docker exec $CONTAINER_ID sh -c "cd /app && npm run db:migrate"
sudo docker exec $CONTAINER_ID sh -c "cd /app && npm run db:seed"
```

### Criação do admin

**Nunca criar a conta de administrador de produção por automação** — é uma credencial real que o responsável pelo negócio deve definir pessoalmente em `https://crm.pulsosh.cloud/onboarding`.

## Resolução de falhas conhecidas

- **Porta 3000 ocupada na VPS**: pertence ao Dokploy (`dokploy.1...`), não ao PULSO CRM. Não parar esse container. Para testes manuais do PULSO CRM na VPS, usar outra porta de host (ex.: 3010).
- **`sudo -n docker ...`**: o usuário `pulso` tem sudo sem senha configurado nessa VPS; usar `-n` (non-interactive) evita que o comando fique esperando senha em sessão não interativa.
- **Disco cheio**: verificar `df -h /` e `sudo -n docker system df` antes de builds grandes. Limpar com `docker system prune -a` (nunca `--volumes` sem confirmar antes quais volumes existem e a quem pertencem).
- **`tsc --noEmit` falhando em `.next/dev/types/routes.d.ts` com erro de sintaxe**: acontece depois de alternar `next dev` (usado pelos testes Playwright) e `next build` no mesmo diretório `.next` — o arquivo de tipos de rotas gerado automaticamente fica inconsistente. Resolve com `rm -rf apps/web/.next` antes de rodar `npm run check` de novo. Não é um bug de código, é um artefato de build.
