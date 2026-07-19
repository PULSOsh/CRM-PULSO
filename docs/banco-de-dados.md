# Banco de dados

## Convenções

- IDs internos em UUID, exceto tabelas do Better Auth.
- Códigos públicos legíveis e sequenciais por ano.
- Datas com timezone quando representam instante.
- Datas sem horário para competência, vencimento e cronograma.
- Valores monetários em `numeric`, nunca ponto flutuante.
- Exclusão lógica para entidades recuperáveis.
- Snapshots JSONB para documentos versionados.
- Índices em busca, datas, relacionamentos e estados.

## Grupos de tabelas

### Identidade

- `user`
- `session`
- `account`
- `verification`
- `portal_users`
- `portal_permissions`

### CRM

- `contacts`
- `companies`
- `company_contacts`
- `pipelines`
- `pipeline_stages`
- `opportunities`
- `activities`
- `tasks`

### Comercial documental

- `products`
- `briefings`
- `proposals`
- `proposal_versions`
- `contracts`

### Operação

- `projects`
- `files`
- `approvals`
- `time_entries`
- `tickets`

### Financeiro

- `financial_accounts`
- `financial_entries`

### Plataforma

- `audit_events`
- `integration_settings`
- `counters`

## Próximas tabelas a implementar

- Templates e versões.
- Itens de proposta.
- Condições de pagamento.
- Parcelas e transações de gateway.
- Signatários e eventos de assinatura.
- Etapas e tarefas de projeto.
- Mensagens e anexos.
- Contratos recorrentes.
- Fornecedores.
- Metas, cenários e reservas.
- Cartões e faturas pessoais.
- Notificações e preferências.
- Importações.
- Consentimentos LGPD.
- Webhooks recebidos.
- Chaves de idempotência.
- Backups e restaurações.

## Códigos

Exemplos:

- `LEAD-2026-0001`
- `OPP-2026-0001`
- `BRF-2026-0001`
- `PROP-2026-0001`
- `CONT-2026-0001`
- `PROJ-2026-0001`
- `COB-2026-0001`
- `REC-2026-0001`
- `SUP-2026-0001`
- `DESP-2026-0001`

A geração deve usar transação e bloqueio no contador para impedir duplicidade.

## Integridade comercial

- Oportunidade exige pipeline e etapa compatíveis.
- Briefing pertence a uma oportunidade.
- Proposta pertence a uma oportunidade.
- Versão pertence a uma proposta.
- Contrato aponta para versão aceita da proposta.
- Projeto pode apontar para contrato.
- Recebimentos e custos podem apontar para projeto.

## Integridade financeira

- Lançamentos empresariais e pessoais compartilham estrutura, mas possuem `scope`.
- Relatórios nunca devem somar os dois livros sem explícita visão consolidada.
- Estorno cria registro compensatório.
- Transferência empresa/pessoa cria par espelhado.
