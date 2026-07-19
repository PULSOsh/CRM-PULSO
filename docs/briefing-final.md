# Briefing final — PULSO CRM

## 1. Objetivo

Reconstruir o CRM da PULSO completamente do zero como sistema interno único para gestão comercial, operacional, financeira, suporte, relacionamento com clientes e planejamento pessoal do fundador.

O produto deve ser utilizável de ponta a ponta. Não será considerado concluído apenas por possuir telas, documentos ou protótipos.

## 2. Princípios

- Um único usuário interno administrativo.
- Clientes podem ter múltiplos usuários no portal, com permissões próprias.
- Mobile-first, responsivo e instalável como PWA.
- Operação manual completa quando integrações estiverem indisponíveis.
- Ações financeiras, publicação, envio e assinatura nunca acontecem sem confirmação.
- Todos os registros críticos possuem auditoria e histórico.
- Sistema começa vazio no ambiente real.
- Dados fictícios existem somente no modo demonstração isolado.
- Português do Brasil, BRL, `America/Fortaleza`, datas `dd/mm/aaaa` e horário de 24 horas.
- Identidade PULSO: Paper `#F4F2ED`, Carbon `#161616`, Signal `#E65318`, Mineral `#7A7A7A`, Neutral `#C9C9C9`.

## 3. Escopo funcional

### Comercial

- Leads, contatos e empresas.
- Prospecção com pré-pipeline.
- Oportunidades com pipelines ilimitados e configuráveis.
- Atividades e interações manuais.
- Briefings públicos.
- Catálogo de produtos e serviços.
- Propostas comerciais como páginas web interativas.
- Contratos e assinaturas.
- Importação CSV/Excel.
- Formulários incorporáveis e API/webhook seguro.

### Operação

- Projetos, etapas, tarefas, dependências e marcos.
- Visão geral, Kanban, cronograma e calendário.
- Arquivos privados.
- Aprovações e revisão.
- Controle de horas.
- Entrega, garantia e continuidade.
- Suporte e manutenção.

### Relacionamento

- Portal geral por cliente.
- Páginas individuais por projeto.
- Usuários e permissões do portal.
- Mensagens vinculadas a projeto, aprovação ou suporte.
- Notificações por portal e e-mail.

### Financeiro empresarial

- Contas a receber e pagar.
- Parcelas, baixas, comprovantes e recibos.
- Despesas, custos, fornecedores e recorrências.
- Margem, lucro e fluxo de caixa.
- Metas, cenários e reservas.
- Regimes de caixa e competência.
- Cobrança manual inicialmente, com camada futura para AbacatePay.

### Finanças pessoais

- Contas, carteiras e cartões.
- Receitas, despesas, dívidas, financiamentos e assinaturas.
- Patrimônio líquido, metas e planejamento.
- Reserva de emergência, viagens, casamento e quitação de dívidas.
- Transferências classificadas entre PULSO e pessoa física.
- Proteção adicional opcional por PIN ou senha.

### Inteligência e administração

- Dashboards personalizáveis.
- Busca global e central de comando.
- Relatórios e exportações.
- Notificações internas, e-mail, Telegram e push.
- Assistência de IA com múltiplos providers.
- Auditoria, segurança, backups e integrações.

## 4. Funil comercial principal

1. Novo lead.
2. Primeiro contato.
3. Qualificação.
4. Briefing solicitado.
5. Briefing recebido.
6. Diagnóstico.
7. Proposta em preparação.
8. Proposta enviada.
9. Negociação.
10. Fechado — ganho.
11. Fechado — perdido.

Pipelines adicionais podem ser criados, editados, arquivados e usados para transferir oportunidades preservando o histórico.

## 5. Prospecção

Estados sugeridos:

- Não pesquisado.
- Pesquisado.
- Pronto para contato.
- Contatado.
- Aguardando resposta.
- Follow-up.
- Respondeu.
- Qualificado.
- Sem interesse.
- Sem resposta.
- Convertido.

Fluxo padrão:

`Lista criada → pesquisado → pronto para contato → primeiro contato → follow-up → respondeu → qualificado → convertido em oportunidade`

## 6. Briefings

- Obrigatórios por padrão.
- Serviços simples podem permitir pular briefing.
- Pular exige justificativa curta e registro em auditoria.
- Cada briefing é uma página pública individual.
- Token seguro, revogável, regenerável e com expiração.
- Autosave, retomada, barra de progresso e anexos.
- Templates por produto, perguntas condicionais e versionamento.
- Status: rascunho, enviado, iniciado, concluído, analisado e arquivado.
- Respostas alimentam proposta, contrato e projeto.
- Proposta não pode ser criada sem briefing concluído ou justificativa aprovada.

## 7. Propostas

A proposta principal é uma página web, com PDF complementar.

Blocos possíveis:

- Capa.
- Introdução da PULSO.
- Contexto entendido.
- Problema ou oportunidade.
- Diagnóstico.
- Solução.
- Escopo e entregáveis.
- Exclusões.
- Etapas e cronograma.
- Investimento.
- Condições de pagamento.
- Adicionais.
- Responsabilidades.
- Revisões.
- Garantia.
- Suporte.
- FAQ.
- Validade.
- Termos resumidos.
- CTA.

Regras:

- Versões publicadas são snapshots imutáveis.
- Alterações relevantes geram nova versão.
- Apenas a versão ativa pode ser aceita.
- Cliente pode selecionar adicionais e condição permitida.
- Cálculos são feitos no servidor.
- Pedido de condição alternativa não altera a proposta sem aprovação.
- Aceite registra identidade, versão, itens, valores, data, hora, IP e evidências.
- Aceite prepara contrato em rascunho, sem envio automático.

## 8. Contratos e assinatura

Providers:

- Assinatura interna PULSO.
- ZapSign como integração externa prioritária.
- Clicksign preparada para o futuro.
- Upload de documento assinado externamente.

Contrato:

- Gerado a partir da proposta aceita.
- Revisto pelo administrador antes de enviar.
- Templates por tipo de serviço.
- Versão assinada imutável.
- Webhooks com validação e idempotência.
- PDF final armazenado privadamente.
- Contrato assinado prepara recebíveis e projeto, sem ações irreversíveis automáticas.

## 9. Projetos

Criação após contrato assinado e condição inicial de pagamento confirmada.

Cada produto pode definir:

- Etapas.
- Checklist.
- Tarefas automáticas.
- Prazos.
- Materiais exigidos.
- Entregáveis.
- Revisões incluídas.
- Garantia.
- Critérios de conclusão.

Visualizações:

- Visão geral.
- Kanban.
- Cronograma.
- Calendário.

Não é possível concluir projeto com aprovação obrigatória pendente.

## 10. Portal do cliente

- Um portal por empresa.
- Vários projetos no mesmo portal.
- Usuários convidados, sem cadastro público.
- Login por senha ou código temporário por e-mail.
- Perfis: administrador do cliente, responsável de projeto, financeiro, aprovador e visualizador.
- Permissões por projeto.
- Dados financeiros ocultos por padrão.
- Acesso a briefings, propostas, contratos, arquivos, aprovações, entregas, pagamentos permitidos, suporte e mensagens.
- Personalização leve com nome, logo e destaque do cliente sem remover a marca PULSO.

## 11. Suporte e recorrência

Tickets:

- Novo.
- Triagem/análise.
- Aguardando cliente.
- Em andamento.
- Resolvido.
- Fechado.

Possuem categoria, prioridade, prazos, arquivos, mensagens, notas internas, horas, custos e cobertura.

Escopo extra pode criar oportunidade vinculada e seguir novo fluxo comercial.

Contratos recorrentes podem ser mensais, trimestrais, semestrais ou anuais, com reajustes, horas incluídas, excedentes, renovação, pausa, cancelamento e MRR.

## 12. Financeiro

### Empresarial

- Lançamentos manuais.
- Receita, despesa, custo direto, custo indireto e transferências.
- Competência, vencimento e pagamento.
- Contas e carteiras.
- Parcelas.
- Comprovantes.
- Recibos em PDF.
- Impostos e reservas.
- Fluxo previsto e realizado.
- Margem por proposta, projeto, produto e cliente.

### Pessoal

- Livro separado do empresarial.
- Dívidas pessoais não entram no passivo da PULSO.
- Visão consolidada mostra empresa e pessoa física sem misturar os livros.
- Transferências geram lançamentos espelhados e exigem classificação.
- Módulo com proteção adicional opcional.

### Integração bancária

Primeira versão: totalmente manual. Não depende de Open Finance ou conexão bancária.

## 13. E-mails

Todos os e-mails são HTML com CSS inline, responsivos e com versão em texto simples.

O editor permite alterar:

- Assunto.
- Título.
- Mensagem.
- Texto de apoio.
- Botões.
- Assinatura.
- Rodapé.
- Variáveis dinâmicas.

O layout estrutural é protegido. Templates são versionados, pré-visualizáveis e testáveis.

## 14. Integrações

Todas são opcionais e podem ser puladas no onboarding.

Estados:

- Não configurada.
- Em teste.
- Ativa.
- Com erro.
- Desativada.

Integrações previstas:

- SMTP, Resend e modo dev.
- Telegram.
- Google Calendar.
- ZapSign.
- Clicksign futura.
- AbacatePay futura.
- OpenAI, Anthropic e Gemini.

Cada recurso possui alternativa manual quando aplicável.

## 15. Notificações

Canais:

- Central interna.
- E-mail.
- Telegram.
- Push da PWA.

Eventos incluem tarefas, follow-ups, briefings, propostas, contratos, aprovações, pagamentos, projetos, suporte e resumos.

Notificações não exibem dados sensíveis na tela bloqueada.

## 16. Segurança e privacidade

- Conta administrativa única.
- Better Auth com e-mail e senha.
- Sem 2FA na primeira versão.
- Sessões revogáveis.
- Bloqueio contra força bruta e rate limit.
- Arquivos fora da pasta pública.
- Tokens públicos armazenados como hash.
- Auditoria de ações críticas.
- Lixeira de 30 dias.
- Propostas publicadas, contratos assinados, pagamentos e auditoria não são apagados.
- Correções financeiras usam estorno ou lançamento compensatório.
- LGPD: consentimento, finalidade, exportação, correção, anonimização e retenção.

## 17. Backups

- Diários por 14 dias.
- Semanais por 8 semanas.
- Mensais por 12 meses.
- Banco e arquivos em rotinas separadas.
- Cópia fora da VPS.
- Criptografia.
- Verificação de integridade.
- Testes periódicos de restauração.
- Backup manual antes de atualizações importantes.

## 18. Critério de conclusão

Fluxo obrigatório de ponta a ponta:

`Lead → oportunidade → briefing → proposta → aceite → contrato → pagamento → projeto → aprovação → entrega → suporte`

Também devem funcionar:

- Clientes, produtos e fornecedores.
- Tarefas e calendário.
- Horas.
- Financeiro empresarial e pessoal.
- Portal.
- PDFs e e-mails HTML.
- Arquivos privados.
- Auditoria e backups.
- Testes dos fluxos críticos.

Integrações opcionais podem permanecer desligadas se houver fluxo manual equivalente.
