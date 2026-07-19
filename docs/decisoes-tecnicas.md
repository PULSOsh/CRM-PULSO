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
