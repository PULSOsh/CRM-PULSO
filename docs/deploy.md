# Deploy e operação

## Requisitos

- Node.js 20.9 ou superior.
- PostgreSQL 16 ou superior; compose usa PostgreSQL 17.
- Volume persistente privado.
- Docker.
- Domínio protegido por HTTPS.

## Desenvolvimento

```bash
cp .env.example .env
docker compose up -d db
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Validação

```bash
npm run typecheck
npm run test
npm run build
```

E2E:

```bash
npx playwright install chromium
npm run test:e2e
```

## Produção

1. Criar banco.
2. Criar volume de arquivos.
3. Definir segredos.
4. Executar migrações.
5. Construir imagem.
6. Executar health check.
7. Configurar proxy.
8. Testar restauração.
9. Criar primeiro administrador por processo controlado.
10. Desativar cadastro aberto.

## Integrações

Não são requisito de inicialização.

- `EMAIL_PROVIDER=dev` permite testar sem enviar.
- `TELEGRAM_ENABLED=false`.
- `AI_PROVIDER=disabled`.
- `SIGNATURE_PROVIDER=internal`.
- `PAYMENT_PROVIDER=manual`.
- `GOOGLE_CALENDAR_ENABLED=false`.

## Backup

Rotinas externas recomendadas:

- `pg_dump` diário.
- Cópia incremental do volume privado.
- Criptografia antes de enviar para destino externo.
- Retenção 14 diários, 8 semanais e 12 mensais.
- Teste de restauração periódico.

## Atualização

1. Backup manual.
2. Deploy em staging.
3. Migração em staging.
4. Testes.
5. Janela de manutenção.
6. Migração em produção.
7. Health check.
8. Smoke tests.
9. Rollback se necessário.

## Observabilidade futura

- Logs JSON.
- Métricas de fila e webhooks.
- Erros de aplicação.
- Tempo de resposta.
- Espaço do volume.
- Falhas de backup.
- Tentativas de login.
