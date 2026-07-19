# Regras de negócio

## Regras gerais

- O ambiente real inicia vazio.
- O modo demonstração usa dados e banco separados.
- O administrador interno é único.
- Integrações podem ser ignoradas sem bloquear módulos.
- Toda ação irreversível exige confirmação.
- Valores monetários são validados no servidor.
- Alterações críticas são auditadas.
- Registros publicados ou assinados não são editados diretamente.

## Comercial

- Toda oportunidade precisa de próxima ação, salvo estado final.
- Uma oportunidade pode mudar de pipeline sem perder histórico.
- Briefing é obrigatório por padrão.
- Pular briefing exige produto elegível e justificativa.
- Proposta depende de briefing concluído ou pulo aprovado.
- Motivo de perda é obrigatório para oportunidade perdida.
- Desconto acima do limite do produto exige confirmação reforçada.
- Margem abaixo da mínima gera alerta.

## Proposta

- Publicação cria versão imutável.
- Apenas versão ativa e válida pode ser aceita.
- Alteração de escopo, valor, prazo, adicional ou pagamento gera versão.
- Visualização não equivale a aceite.
- Aceite inclui identidade e evidências.
- Pedido de condição alternativa não altera documento vigente.

## Contrato

- Contrato depende de proposta aceita.
- Envio depende de revisão administrativa.
- Assinatura final congela a versão.
- Cancelamento preserva documento e eventos.
- Webhook duplicado não duplica ação.

## Projeto

- Criação automática deve ser idempotente.
- Início pode exigir pagamento inicial confirmado.
- Etapas podem ser personalizadas por projeto.
- Revisões são contadas.
- Revisão extra pode ser cortesia, cobrada ou virar oportunidade.
- Projeto não conclui com aprovação obrigatória pendente.
- Conclusão registra entrega, data e início da garantia.

## Financeiro

- Primeira versão opera manualmente.
- Pagamento manual exige data, valor, método e responsável pela confirmação.
- Pagamento parcial mantém saldo.
- Estorno não apaga lançamento.
- Empresa e pessoa física são livros distintos.
- Transferência entre livros exige classificação e lançamento espelhado.
- Taxas, impostos, horas e custos entram na margem real.
- Valores pessoais ficam ocultos fora do módulo quando bloqueado.

## Portal

- Sem cadastro público.
- Convite pode ser revogado.
- Usuário não pode elevar a própria permissão.
- Permissões podem variar por projeto.
- Financeiro não é exibido por padrão.
- Notas internas nunca aparecem no portal.
- Remover acesso preserva autoria e histórico.

## Arquivos

- Arquivo não é servido diretamente.
- MIME, extensão e tamanho são validados.
- SHA-256 é registrado.
- Arquivos podem ser deduplicados.
- Exclusão inicial move para lixeira.
- Backup de arquivos é separado do banco.

## IA

- Toda saída é sugestão.
- Provider e modelo são registrados.
- Não envia, publica, cobra, assina ou exclui.
- Dados sensíveis precisam de autorização explícita.
- Limites e custos são configuráveis.
