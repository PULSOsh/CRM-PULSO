# Progresso transparente

## Implementado nesta entrega

### Fundação

- Monorepo com workspaces.
- Next.js App Router.
- TypeScript estrito.
- Tailwind CSS.
- Docker e PostgreSQL.
- PWA manifest.
- Tema claro e escuro.
- Ocultação de valores.
- Identidade visual PULSO.
- Navegação desktop e mobile.
- Health check.

### Banco e autenticação

- Conexão PostgreSQL/Drizzle.
- Schema inicial amplo.
- Tabelas do Better Auth.
- Configuração do Better Auth.
- Seed do pipeline e produtos.

### Interface

- Central de hoje.
- Páginas de módulos.
- Projetos.
- Tarefas e calendário.
- Financeiro empresarial.
- Finanças pessoais.
- Assistente de IA.
- Configuração de integrações.
- Busca global.
- Preview estático.

### Páginas públicas

- Briefing demonstrativo com autosave visual.
- Proposta interativa com adicionais e parcelas.
- Portal demonstrativo.

### Infraestrutura de domínio

- EmailProvider de desenvolvimento.
- Templates HTML/CSS inline.
- Interfaces de IA, assinatura, pagamento e Telegram.
- Assinatura interna.
- Pagamento manual.
- Armazenamento privado local.
- Hash de documentos.
- Rota pública de captura de lead com Zod e honeypot.

### Qualidade

- Teste unitário de códigos.
- Testes E2E de fumaça preparados.
- Documentação consolidada.

## Parcial

- Autenticação está configurada, mas ainda precisa de telas de login, onboarding e criação controlada do administrador.
- Schema cobre o núcleo, mas faltam tabelas complementares listadas em `banco-de-dados.md`.
- Páginas de módulos usam dados demonstrativos.
- PDF possui contrato de interface e placeholder; renderização real via Chromium ainda precisa ser ligada.
- PWA tem manifest; service worker e sincronização offline ainda não estão implementados.
- Modo demonstração está representado por dados e configuração; isolamento de banco precisa ser aplicado no deploy.
- E-mail possui renderer e modo dev; SMTP e Resend precisam de adapters.
- Arquivos privados possuem adapter; rotas de upload e download ainda precisam ser conectadas.

## Não implementado ainda

- CRUD persistente completo de todos os módulos.
- Automações transacionais.
- Builder de templates.
- Convites e login do portal.
- Mensagens.
- Importação CSV/Excel.
- Exportações.
- ZapSign real.
- AbacatePay real.
- Google Calendar.
- Telegram.
- Providers reais de IA.
- Notificações push.
- Backup executado pela interface.
- Conciliação ou importação bancária, que não faz parte da primeira versão.
- Teste completo do fluxo ponta a ponta.

## Próxima sequência recomendada

1. Onboarding e autenticação.
2. CRUD de contatos, empresas, pipelines e oportunidades.
3. Briefing persistente.
4. Proposta versionada.
5. Contrato interno.
6. Financeiro manual.
7. Projeto, tarefas, arquivos e aprovações.
8. Portal.
9. Suporte e recorrência.
10. Relatórios, integrações e produção.

## Definição honesta

A entrega é uma base real, extensa, compilável e visualmente navegável. Não é o CRM final pronto para operação comercial. O objetivo é evitar a repetição de entregas apenas documentais, fornecendo código e arquitetura suficientes para desenvolvimento contínuo com rastreabilidade.
