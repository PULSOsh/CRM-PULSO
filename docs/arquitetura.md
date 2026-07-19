# Arquitetura

## Visão geral

Monorepo com Next.js App Router, React, TypeScript estrito, Tailwind CSS, PostgreSQL, Drizzle ORM e Better Auth.

```text
Navegador/PWA
  ├─ CRM interno
  ├─ Portal do cliente
  └─ Páginas públicas seguras
        ↓
Next.js App Router
  ├─ Server Components
  ├─ Route Handlers
  ├─ Server Actions futuras
  └─ validação Zod
        ↓
Camada de domínio
  ├─ comercial
  ├─ projetos
  ├─ financeiro
  ├─ documentos
  ├─ notificações
  └─ auditoria
        ↓
PostgreSQL + volume privado da VPS
        ↓
Adapters opcionais
  ├─ EmailProvider
  ├─ SignatureProvider
  ├─ PaymentProvider
  ├─ AiProvider
  ├─ TelegramProvider
  └─ StorageAdapter
```

## Estrutura do monorepo

- `apps/web`: aplicação Next.js.
- `packages/database`: schema, conexão, migrações e seed.
- `packages/email`: renderização HTML/CSS e providers.
- `packages/documents`: snapshots, hash e renderização de PDF.
- `packages/integrations`: contratos dos providers.
- `packages/storage`: arquivos privados locais.
- `packages/ui`: componentes visuais compartilhados.
- `docs`: especificação e operação.
- `preview`: visão estática sem instalação.

## Limites de responsabilidade

### Interface

A interface apenas coleta intenção, apresenta dados e solicita confirmação. Não deve calcular valores comerciais finais sozinha.

### Domínio

A camada de domínio valida transições, permissões, idempotência, valores e regras de negócio.

### Persistência

PostgreSQL é a fonte de verdade de registros e estados. Arquivos físicos ficam em volume privado, com metadados no banco.

### Integrações

Nenhum módulo importa SDK externo diretamente. Toda integração passa por interface substituível.

## Idempotência

Obrigatória em:

- Geração de cobrança.
- Recepção de webhook.
- Criação de projeto após pagamento.
- Geração de recibo.
- Envio de e-mail transacional.
- Criação de envelope de assinatura.
- Processamento de importações.

Cada ação utiliza uma chave única e registra o resultado anterior.

## Versionamento

Documentos publicáveis usam duas entidades:

- Registro lógico: proposta, contrato ou aprovação.
- Versão/snapshot: conteúdo imutável publicado.

O PDF é derivado do snapshot e inclui hash.

## Eventos e auditoria

Ações críticas geram eventos imutáveis:

- Autor.
- Ação.
- Entidade.
- Antes e depois.
- Data e hora.
- IP e user agent quando disponíveis.
- Hash do evento.

Automação interna futura pode consumir os eventos sem acoplar módulos.

## Armazenamento

`LocalPrivateStorage` grava fora de `public/`.

Controles:

- Nome interno aleatório.
- Lista permitida de MIME.
- Limite de tamanho.
- SHA-256.
- Permissão `0600`.
- Download por rota autenticada.
- Lixeira.
- Backup separado.
- Interface preparada para migração futura.

## Autenticação

Better Auth com Drizzle/PostgreSQL.

- Usuário interno: conta administrativa.
- Portal: modelo separado de usuários e permissões.
- Links públicos: slug legível + token secreto.
- Tokens devem ser armazenados como hash.
- Em produção, cookies seguros e HTTPS obrigatórios.

## PWA e offline

Primeira etapa:

- Manifest.
- Instalação.
- Interface responsiva.
- Cache futuro de shell e dados recentes.

Offline permitido futuramente:

- Leitura recente.
- Rascunhos.
- Notas e tarefas.

Offline proibido:

- Publicar.
- Assinar.
- Cobrar.
- Excluir.
- Confirmar pagamento.

## Ambientes

- Desenvolvimento.
- Staging.
- Produção.
- Demonstração isolada.

Cada ambiente usa banco, segredos, domínio e armazenamento próprios.

## Estratégia de construção

1. Fundação e autenticação.
2. Comercial.
3. Briefings.
4. Propostas.
5. Contratos e pagamentos.
6. Projetos, arquivos e aprovações.
7. Portal.
8. Financeiro completo.
9. Inteligência e relatórios.
10. Segurança, testes e produção.
