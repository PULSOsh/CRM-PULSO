# Segurança e privacidade

## Autenticação

- Better Auth.
- E-mail e senha.
- Mínimo sugerido de 12 caracteres.
- Cookies seguros em produção.
- Sessões revogáveis.
- Recuperação por e-mail.
- Sem 2FA na primeira versão por decisão de escopo.

## Proteção de acesso

- Rate limit em login, recuperação e páginas públicas.
- Bloqueio progressivo contra força bruta.
- Registro de login, logout e revogação.
- Botão para encerrar todas as sessões.
- Cabeçalhos de segurança e CSP.
- HTTPS obrigatório.
- Segredos apenas em variáveis de ambiente.

## Links públicos

- Slug legível não é segredo.
- Token aleatório é obrigatório.
- Banco armazena apenas hash do token.
- Expiração, revogação e regeneração.
- Operações sensíveis pedem identificação adicional.
- Contratos podem exigir código por e-mail ou login.

## Arquivos

- Volume privado.
- Sem URL pública permanente.
- Downloads autenticados ou temporários.
- Nome aleatório.
- MIME permitido.
- Limite de 25 MB inicial.
- Hash de integridade.
- Verificação futura de malware recomendada.

## Auditoria

Eventos para:

- Mudanças comerciais importantes.
- Publicação e aceite.
- Contratos e assinaturas.
- Cobranças, baixas e estornos.
- Permissões do portal.
- Exportação.
- Exclusão, restauração e anonimização.
- Configuração de integrações.

Eventos de auditoria não são excluídos pela interface.

## LGPD

- Consentimento versionado.
- Finalidade de coleta.
- Exportação de dados.
- Correção.
- Anonimização.
- Retenção configurável.
- Exclusão respeitando obrigações legais e financeiras.
- Registro de acesso a dados sensíveis.

## Finanças pessoais

- PIN ou senha adicional opcional.
- Desbloqueio somente no dispositivo atual.
- Timeout.
- Ocultação rápida.
- Busca e push sem valores.
- Exportação pede nova confirmação.

## Integrações

- Credenciais criptografadas.
- Webhooks autenticados.
- Assinatura e timestamp de webhook.
- Proteção contra replay.
- Idempotência.
- Escopo mínimo de permissões.
- Bot do Telegram autorizado apenas para chat cadastrado.

## Checklist de produção

- Trocar todos os segredos.
- Desativar cadastro público do usuário interno.
- Configurar HTTPS.
- Configurar CSP.
- Configurar rate limit.
- Validar restauração.
- Ativar logs estruturados.
- Revisar permissões do volume.
- Testar e-mails.
- Testar webhooks em staging.
- Rodar testes E2E.
