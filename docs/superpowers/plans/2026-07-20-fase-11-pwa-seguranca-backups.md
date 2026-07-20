# Fase 11: PWA, Segurança e Backups

## 1. PWA e Service Worker
**Objetivo:** Transformar o CRM em um aplicativo instalável, com cache de rotas e suporte a modo offline básico, além de assentar fundações para notificações push no futuro.

- [ ] Instalar e configurar o `serwist/next` (ou usar Service Worker nativo customizado).
- [ ] Registrar o Service Worker no App Router (`layout.tsx`).
- [ ] Definir estratégias de cache para estáticos (Stale-While-Revalidate) e páginas (Network-First).
- [ ] Adicionar tela de fallback `/offline` caso o cliente perca conexão.

## 2. Segurança Reforçada (Security Headers)
**Objetivo:** Elevar o nível de proteção do front-end contra injeções, framing e sniffing.

- [ ] Incluir Content-Security-Policy (CSP) via Middleware ou `next.config.ts` (permitindo scripts necessários do Next e integradores).
- [ ] Configurar cabeçalhos HSTS, `X-Frame-Options` (DENY/SAMEORIGIN), `X-Content-Type-Options` (nosniff) e `Referrer-Policy`.
- [ ] Garantir que o Middleware não conflite com essas políticas ao autenticar rotas.

## 3. Rotinas de Backup Manual e Automatizado
**Objetivo:** Cumprir o requisito de "Backup executado pela interface" e preparar para o automatizado externo.

- [ ] Desenvolver a API de Dump Dinâmico: Ler dinamicamente o Schema do Drizzle e gerar um JSON estruturado ou CSV de todas as tabelas vitais para restauração (JSON Dumps).
- [ ] Criar a interface em `/app/configuracoes/seguranca` (adicionando à página existente) com um botão de "Baixar Backup Completo" e "Agendar Backup Local".
- [ ] Adicionar o endpoint `/api/admin/backup` restrito ao admin.
- [ ] Exportar esses dados envelopados (ex: ZIP ou múltiplos JSONs num único GZ) para otimização de banda.

## 4. Revisão e Validação Final
- [ ] Teste E2E validando a rota restrita de backup.
- [ ] Build de produção para verificar se a injeção do Service Worker não corrompe a otimização estática.
- [ ] Lighthouse Audit de PWA.
