# Fase 10 — Notificações internas e Telegram bidirecional

## Objetivo

Criar uma central interna persistente e integrar um bot privado do Telegram para alertas e comandos administrativos estruturados. A central interna é o registro confiável; indisponibilidade do Telegram nunca desfaz nem bloqueia a ação principal do CRM.

## Modelo de segurança

- Apenas o bot configurado por `TELEGRAM_BOT_TOKEN` e o chat privado identificado por `TELEGRAM_CHAT_ID` podem operar o CRM.
- Webhook em `/api/integrations/telegram/webhook`, validado pelo header oficial `X-Telegram-Bot-Api-Secret-Token` contra `TELEGRAM_WEBHOOK_SECRET` com comparação constante.
- Atualizações de outro chat recebem resposta genérica ou são ignoradas; nunca consultam dados.
- Token, chat ID e segredo ficam em variáveis de ambiente do Dokploy/VPS, nunca no banco, HTML, logs ou Git.
- Toda atualização usa `update_id` único para idempotência. Reentrega do Telegram não repete tarefa, nota ou auditoria.
- Comandos de escrita não executam imediatamente: geram uma ação pendente de curta duração e botões inline “Confirmar”/“Cancelar”. O callback confirmado é idempotente e auditado.
- A reserva de `update_id` e a confirmação da ação usam insert/update condicional atômico dentro de transação; duas entregas concorrentes produzem no máximo um efeito.
- Respostas não incluem documentos, dados financeiros detalhados, tokens públicos, conteúdo de notas internas ou segredos. Links apontam para páginas autenticadas do CRM.

## Persistência

### `admin_notifications`

- `id`, `eventKey` único, `type`, `title`, `summary`, `entityType`, `entityId`, `securePath`, `readAt`, `telegramStatus`, `telegramMessageId`, `telegramError`, timestamps.
- `eventKey` evita alertas duplicados quando uma Server Action é repetida.
- O conteúdo é curto e operacional; detalhes permanecem na entidade de origem.
- Convenção de chave: `<evento>:<entidade-id>:<versão-ou-id-do-evento>`, com no máximo 180 caracteres. Título tem no máximo 120 e resumo 500 caracteres.

### `telegram_updates`

- `updateId` único, `chatId`, `command`, `status`, `error`, `processedAt`, timestamps.
- Armazena metadados mínimos para idempotência e diagnóstico, não o histórico integral da conversa.

### `telegram_pending_actions`

- `id`, `chatId`, `actionType`, payload JSON tipado e validado, `expiresAt`, `confirmedAt`, `cancelledAt`, timestamps.
- Expiração de 10 minutos; callback depois disso apenas informa que o comando expirou.
- Descrição de tarefa tem no máximo 200 caracteres e nota no máximo 2.000; payload maior é rejeitado antes de persistir.

## Central interna

- `/app/inteligencia/notificacoes` lista notificações reais, com filtros “Todas” e “Não lidas”.
- Ações: marcar uma como lida, marcar todas como lidas e abrir a entidade pelo `securePath` validado no servidor.
- Contador de não lidas aparece na navegação/central de hoje sem consulta a dados demonstrativos.
- Eventos iniciais obrigatórios:
  - condição alternativa solicitada em proposta;
  - alterações solicitadas em aprovação pública ou pelo portal;
  - chamado aberto pelo portal;
  - nova resposta do cliente em chamado existente.

O helper `notifyAdmin()` insere a notificação e tenta enviar Telegram. Os chamadores capturam falhas do subsistema de aviso, registram diagnóstico e concluem normalmente a operação principal.

## Telegram de saída

- Provider real em `packages/integrations`, usando `fetch` contra `https://api.telegram.org/bot<TOKEN>/sendMessage`.
- Mensagem: título, resumo sanitizado e URL segura da entidade; sem botões que executem ações financeiras.
- Estados persistidos: enviado, desativado ou erro. Uma falha pode ser reenviada manualmente pela central.

## Telegram de entrada

### `/hoje`

Retorna contagens e resumos curtos de tarefas vencidas/para hoje, aprovações pendentes, financeiro vencido, próximas ações de oportunidades e chamados novos. Reaproveita um serviço de consulta extraído da Central de Hoje para evitar divergência de regra.

### `/buscar <termo>`

Busca empresas e projetos por código/nome, limita a oito resultados e devolve links autenticados. Termos com menos de dois caracteres são rejeitados.

### `/tarefa <descrição> [| DD/MM/AAAA HH:mm]`

Mostra a prévia e pede confirmação. Quando confirmado, cria tarefa geral com prioridade normal e prazo opcional em `America/Fortaleza`, registra auditoria com origem Telegram e responde com sucesso.

### `/nota <empresa|projeto> <código> | <texto>`

Resolve a entidade pelo código exato (`EMP-...` ou `PROJ-...`), mostra prévia e pede confirmação. Quando confirmado, insere uma linha real em `activities` com `type="note"`, `channel="telegram"` e `createdBy="telegram:<chatId>"`, registra auditoria e retorna link da entidade.

### Comandos auxiliares

- `/ajuda`: sintaxe e exemplos sem dados do CRM.
- Texto livre ou comando desconhecido: orienta a usar `/ajuda`; não tenta interpretar com IA.
- `/cancelar`: cancela atomicamente todas as ações ainda pendentes do chat autorizado.

## Configuração e operação

- `/app/configuracoes/integracoes` deixa de ser preview estático e mostra estados reais: desativado, não configurado, em teste, ativo ou com erro.
- Ações autenticadas: testar `getMe`, consultar `getWebhookInfo`, registrar/atualizar webhook e enviar mensagem de teste ao chat autorizado.
- O webhook usa `BETTER_AUTH_URL`/URL pública configurada para montar o endpoint; nenhuma URL é aceita do formulário.
- Sem credenciais, o CRM e a central interna funcionam normalmente e a interface explica quais variáveis faltam sem revelar valores.

## Tratamento de falhas

- Timeout curto e `AbortController` nas chamadas Telegram.
- Respostas não-2xx são convertidas em erro sanitizado, sem registrar token nem corpo sensível.
- `notifyAdmin()` nunca lança erro para a operação de negócio depois de persistir/registrar a tentativa; comandos recebidos retornam mensagem clara e marcam a atualização como erro para diagnóstico.
- A configuração de webhook é uma ação explícita do administrador, auditada e nunca executada automaticamente no build/deploy.

## Validação

- Testes unitários para parser de comandos, datas no fuso local, sanitização, autorização de chat, expiração e idempotência.
- E2E real cria os quatro eventos de negócio e verifica central, contador, leitura e ausência de duplicação.
- E2E verifica tela de integração no estado sem credenciais sem quebrar o core.
- Validação externa obrigatória antes de fechar a fase, com bot/chat reais fornecidos pelo responsável: `getMe`, registro do webhook, mensagem de teste, `/hoje`, `/buscar`, criação confirmada de tarefa e nota confirmada.
- Suíte Playwright completa, TypeScript, lint, Vitest e build na VPS antes do commit/push.

## Fora do escopo

- Linguagem natural/IA, áudio, anexos e grupos com múltiplos administradores.
- Comandos financeiros, assinatura, publicação de proposta ou qualquer ação irreversível.
- Telegram como armazenamento primário de conversas; o CRM persiste somente o necessário para notificação, idempotência e auditoria.
- Push PWA, que pertence à Fase 11.
