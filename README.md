# PULSO CRM

Base funcional e documentada para o CRM interno da PULSO.

## Esta entrega inclui

- Interface navegável com identidade PULSO.
- Central de hoje e principais módulos.
- Prévia pública de briefing, proposta e portal do cliente.
- Estrutura PostgreSQL/Drizzle para o núcleo do CRM.
- Autenticação preparada com Better Auth.
- Camadas para e-mail, IA, assinatura, pagamentos, Telegram, armazenamento e PDFs.
- Templates de e-mail em HTML com CSS inline.
- Docker para desenvolvimento e produção.
- Documentação de arquitetura, telas, fluxos, regras, segurança e deploy.
- Testes unitários e base de testes E2E.
- Modo demonstração isolado por configuração.
- Preview estático em `preview/index.html`.

## Início rápido

```bash
cp .env.example .env
docker compose up -d db
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Abra `http://localhost:3000`.

As integrações externas são opcionais. O CRM deve continuar operando manualmente quando elas estiverem desativadas.

## Preview sem instalar

Abra `preview/index.html` diretamente no navegador.

## Comece pela documentação

1. `docs/briefing-final.md`
2. `docs/arquitetura.md`
3. `docs/mapa-de-telas.md`
4. `docs/progresso.md`

## Estado da entrega

Esta é uma fundação avançada, navegável e compilável. O status detalhado de cada módulo está em `docs/progresso.md`.
