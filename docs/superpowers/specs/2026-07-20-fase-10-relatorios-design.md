# Fase 10 — Relatórios e exportações

## Objetivo

Substituir `/app/inteligencia/relatorios` por painéis comerciais, operacionais e financeiros calculados diretamente do PostgreSQL, com filtro de período e exportação CSV autenticada. Nenhum número será armazenado como amostra ou fabricado na interface.

## Escopo

### Visão comercial

- Leads criados no período, separados por status e origem.
- Oportunidades criadas no período e fechadas como ganhas/perdidas no período. A Fase 10 adicionará `closedAt` a `opportunities`: fica nulo enquanto aberta e recebe a data real ao marcar como ganha/perdida. Registros legados fechados sem evidência temporal ficam fora das métricas de fechamento, mas continuam visíveis no total histórico quando houver data.
- Valor do pipeline aberto e valor ganho.
- Taxa de conversão de leads concluídos: `converted / (converted + disqualified)`; quando o denominador for zero, mostrar “Sem dados”, nunca `0%` como resultado inventado.
- Taxa de ganho de oportunidades encerradas: `won / (won + lost)`, com a mesma regra para ausência de dados.

### Visão operacional

- Projetos por status como fotografia atual, sem filtro de período, explicitamente rotulada na interface.
- Aprovações pendentes como fotografia atual; aprovações decididas no período, separadas entre aprovadas e alterações solicitadas, usando `decidedAt`.
- Horas registradas no período e comparação com horas estimadas dos projetos relacionados.
- Chamados criados no período por status e tempo médio dos ciclos resolvidos no período, apenas para chamados com `resolutionStartedAt` e `resolvedAt` reais. A Fase 10 adicionará ambas as colunas a `tickets`; registros antigos sem evidência ficam fora da média.

### Visão financeira

- Somente `financial_entries.scope="company"`; finanças pessoais nunca entram nos relatórios empresariais.
- A receber e a pagar previstos por vencimento.
- Entradas e saídas realizadas por data de pagamento.
- Total vencido ainda não quitado.
- Resultado realizado: entradas pagas menos saídas pagas, preservando estornos como lançamentos compensatórios já modelados.

### Períodos

- Atalhos: últimos 30 dias, últimos 90 dias, ano atual e todo o período.
- Datas são interpretadas no fuso `America/Fortaleza` e exibidas em `dd/mm/aaaa`.
- Valores aceitos na URL/API: `30d`, `90d`, `year` e `all`. `30d`/`90d` são dias-calendário locais: começam à 00:00 de 29/89 dias atrás e incluem o dia atual até agora. Intervalos têm início inclusivo e fim exclusivo no instante atual; `year` inicia em 1º de janeiro à 00:00 no fuso local e `all` omite o limite inicial. Colunas SQL `date` usam as datas locais correspondentes aos mesmos limites.
- O filtro usa `createdAt` para leads, oportunidades criadas e chamados criados; `closedAt` para oportunidades ganhas/perdidas; `decidedAt` para aprovações decididas; `startedAt` para horas; `resolvedAt` para ciclos de chamado resolvidos; `dueDate` para financeiro previsto; e `paidAt` para realizado. Projetos por status na página são exclusivamente fotografia atual; `projects.createdAt` só seleciona as linhas “projeto criado” do CSV operacional. A interface explicará a base temporal de cada bloco.
- Projetos por status, aprovações pendentes e totais atualmente em aberto são fotografias do momento e não mudam com o seletor de período; métricas de fluxo deixam explícita a data usada.

### Semântica de fechamento

- Oportunidade marcada como ganha ou perdida recebe `closedAt=now()`. Qualquer futura ação de reabertura deverá limpar `closedAt`; a versão atual não oferece reabertura.
- Chamado novo recebe `resolutionStartedAt=now()` e `resolvedAt=null`. Ao entrar em `resolved` ou `closed`, recebe `resolvedAt=now()`; a duração é sempre `resolvedAt - resolutionStartedAt`. Transição `resolved` → `closed` preserva ambas as datas. Resposta do cliente que reabre chamado, ou mudança administrativa de `resolved`/`closed` para `new`/`in_progress`/`waiting_customer`, define `resolutionStartedAt=now()` e limpa `resolvedAt`, iniciando um novo ciclo mensurável. Registros legados só passam a participar da média quando um ciclo novo fornece as duas datas.

### Exportação

- Endpoint autenticado `/api/reports/export?report=<tipo>&period=<período>`.
- Tipos iniciais: `commercial`, `operations` e `financial`.
- CSV UTF-8 com BOM, cabeçalhos em português, separador `;`, valores monetários lidos das colunas `numeric(..., scale: 2)` já em reais e formatados com duas casas/vírgula decimal, e datas em `dd/mm/aaaa`.
- `commercial`: uma linha por lead ou oportunidade relevante, com `tipo`, `codigo`, `titulo`, `status`, `origem`, `valor_esperado`, `criado_em` e `fechado_em`; campos não aplicáveis ficam vazios.
- `operations`: uma linha por evento, com `tipo`, `evento`, `codigo`, `titulo`, `status`, `projeto`, `data_evento`, `minutos` e `tempo_resolucao_minutos`; eventos possíveis são `projeto_criado`, `aprovacao_decidida`, `aprovacao_pendente_atual`, `horas_registradas`, `chamado_criado` e `chamado_resolvido`. Um chamado criado e resolvido no período produz duas linhas, cada uma com sua data. Fotografias atuais pendentes são incluídas com `data_evento` vazia; campos não aplicáveis ficam vazios.
- `financial`: uma linha por lançamento empresarial cujo vencimento ou pagamento esteja no período, sem duplicar a mesma entrada, com `codigo`, `direcao`, `tipo`, `descricao`, `status`, `competencia`, `vencimento`, `pagamento`, `valor_previsto` e `valor_realizado`.
- O endpoint recalcula os dados no servidor com o mesmo serviço usado pela página; não exporta HTML nem confia em valores enviados pelo navegador.
- Cada exportação registra auditoria com tipo e período, sem copiar o conteúdo completo do relatório para o log.

## Arquitetura

- `apps/web/src/lib/reports/period.ts`: valida o enum de período e produz limites temporais inclusivo/exclusivo.
- `apps/web/src/lib/reports/queries.ts`: consultas agregadas reais, sem dependência de React.
- `apps/web/src/lib/reports/csv.ts`: serialização CSV determinística e proteção contra formula injection, prefixando com apóstrofo (`'`) células iniciadas por `=`, `+`, `-` ou `@`.
- `/app/inteligencia/relatorios/page.tsx`: Server Component que lê `searchParams`, consulta o serviço e renderiza cards/tabelas/barras CSS responsivas.
- `/api/reports/export/route.ts`: autenticação Better Auth, validação Zod, geração e auditoria.

Os serviços serão pequenos e independentes para permitir teste unitário das regras de período/CSV e E2E da página e do download.

## Estados e erros

- Banco vazio mostra zeros somente para contagens/somas matemáticas e “Sem dados” para taxas/médias sem denominador.
- Período inválido retorna 400 na exportação e recua para 30 dias na página.
- Falha de consulta rende erro do servidor; não substitui números por dados demonstrativos.
- CSV não expõe finanças pessoais, configuração de integração, tokens, documentos pessoais ou conteúdo de notas internas.

## Validação

- Testes unitários para limites de período, taxas sem denominador, formatação CSV e formula injection.
- E2E real cria dados rastreáveis, abre os três painéis, verifica KPIs derivados e baixa um CSV autenticado.
- E2E confirma que um lançamento pessoal criado no mesmo fluxo não aparece no relatório/exportação empresarial.
- TypeScript, lint, Vitest, build e suíte Playwright completa na VPS antes do commit da fase.

## Fora do escopo

- PDF, XLSX, BI externo e dashboards rearranjáveis.
- Previsões por IA.
- Métricas que exigiriam dados históricos inexistentes ou backfill especulativo.
