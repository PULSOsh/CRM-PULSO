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

## Resolução de falhas conhecidas

- **Porta 3000 ocupada na VPS**: pertence ao Dokploy (`dokploy.1...`), não ao PULSO CRM. Não parar esse container. Para testes manuais do PULSO CRM na VPS, usar outra porta de host (ex.: 3010).
- **`sudo -n docker ...`**: o usuário `pulso` tem sudo sem senha configurado nessa VPS; usar `-n` (non-interactive) evita que o comando fique esperando senha em sessão não interativa.
- **Disco cheio**: verificar `df -h /` e `sudo -n docker system df` antes de builds grandes. Limpar com `docker system prune -a` (nunca `--volumes` sem confirmar antes quais volumes existem e a quem pertencem).
- **`tsc --noEmit` falhando em `.next/dev/types/routes.d.ts` com erro de sintaxe**: acontece depois de alternar `next dev` (usado pelos testes Playwright) e `next build` no mesmo diretório `.next` — o arquivo de tipos de rotas gerado automaticamente fica inconsistente. Resolve com `rm -rf apps/web/.next` antes de rodar `npm run check` de novo. Não é um bug de código, é um artefato de build.
