# Prompt para o Antigravity

Você vai assumir o desenvolvimento do PULSO CRM no repositório:

`D:\PULSO\PULSO_CRM_NOVA_BASE\pulso-crm`

Trabalhe de forma autônoma e rigorosa até concluir as Fases 10, 11 e 12. Antes de qualquer ação, leia integralmente e nesta ordem:

1. `docs/handoff-antigravity.md`;
2. `docs/handoff-codex.md`;
3. `docs/progresso.md`;
4. `docs/validacao.md`;
5. `docs/decisoes-tecnicas.md`;
6. `docs/operacao.md`;
7. os specs e planos em `docs/superpowers/`.

Estado inicial obrigatório:

- branch `codex/fase-10`;
- HEAD `fb0385e`;
- Fase 9 já publicada e migração 0007 já aplicada em produção;
- Fase 10 não commitada, com mudanças importantes no working tree;
- relatórios Tasks 1–6 concluídas e revisadas;
- Task 7 E2E em andamento;
- notificações/Telegram apenas especificados, sem implementação.

Não faça reset, checkout destrutivo, stash ou descarte do working tree. Rode `git status --short` e preserve tudo.

Comece exatamente pela Task 7 de relatórios:

1. Inspecione `apps/web/e2e/relatorios.spec.ts` e os E2E existentes de propostas para confirmar a forma correta de abrir uma proposta pública.
2. A última alteração passou a montar a URL com `link_token` e `publicSlug`, mas ainda não foi validada. Rode primeiro o caso Chromium focado `cria o projeto` na VPS de desenvolvimento.
3. Corrija somente a causa real. Não use mock e não insira diretamente no banco para contornar um fluxo de produto existente.
4. Depois rode `e2e/relatorios.spec.ts` completo em Chromium e mobile, escreva o relatório da Task 7 e faça revisão independente.
5. Execute o checkpoint de relatórios: typecheck, lint, Vitest, build, E2E e `git diff --check`.

Em seguida implemente integralmente `docs/superpowers/plans/2026-07-20-fase-10-notificacoes-telegram.md`, tarefa por tarefa. O Telegram é um canal privado bidirecional de aviso e comunicação administrativa. Implemente provider real, central persistente, eventos reais, webhook seguro/idempotente, tela de configuração e os comandos `/hoje`, `/buscar`, `/tarefa`, `/nota`, `/ajuda` e `/cancelar`. Escritas precisam de confirmação atômica e expiração. Telegram indisponível nunca pode bloquear o core do CRM.

Para fechar a Fase 10, exija credenciais reais configuradas fora do Git (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`) e valide o bot/chat reais. Se essas credenciais forem o único bloqueio restante, pare e peça ao responsável que as configure com segurança; não invente valores e não registre segredos em arquivos ou logs.

Política de qualidade e publicação:

- TypeScript estrito, sem `any` novo;
- implementação real, nunca mock de fluxo do CRM;
- dados E2E únicos por execução;
- Playwright real na VPS `pulso@191.96.251.124`, diretório `~/pulso-crm-app`, app em `PORT=3010`;
- usar PowerShell e `$env:USERPROFILE\.ssh\pulso_vps` para SSH/SCP;
- SSH é intermitente: após timeout, aguarde 90–150 s;
- não tocar na porta 3000 da VPS;
- nenhum commit/push enquanto a fase não estiver completamente verde;
- antes do commit: suíte completa, build, E2E desktop/mobile, documentação, revisão do diff e busca de segredos;
- atualizar `docs/progresso.md`, `docs/validacao.md`, `docs/decisoes-tecnicas.md` e `docs/operacao.md` no formato das fases anteriores;
- fazer um único commit da Fase 10 e push em `master`; o push redeploya automaticamente o Dokploy;
- acompanhar o deploy, confirmar `/api/health` 200, aplicar migrações 0008/0009 no `pulsodb` conforme `docs/operacao.md` e executar smoke real;
- não criar automaticamente o administrador de produção.

Depois de fechar a Fase 10, continue com a Fase 11 (PWA, segurança e backups) e a Fase 12 (testes e correções finais), mantendo o mesmo padrão: design/plano, implementação real, E2E, revisão, docs, commit/push por fase e validação de produção.

Mantenha um registro claro de cada comando e resultado. Não declare uma tarefa concluída sem evidência executada. Ao encontrar um defeito, diferencie falha de produto, falha de teste e instabilidade de infraestrutura antes de corrigir.
