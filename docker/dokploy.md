# Deploy no Dokploy

1. Crie o serviço PostgreSQL persistente.
2. Cadastre as variáveis do `.env.example`.
3. Monte volume persistente em `/app/storage/private`.
4. Use `docker/Dockerfile`.
5. Execute migrações antes da primeira inicialização.
6. Configure health check em `/api/health`.
7. Use Cloudflare com HTTPS.
8. Faça backup do banco e dos arquivos em rotinas separadas.
