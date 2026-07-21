# RELATÓRIO EXECUTIVO DE AUDITORIA E PLANO DE MELHORIA CONTÍNUA — PULSO CRM

**Projeto:** PULSO CRM (`d:\PULSO\PULSO_CRM_NOVA_BASE\pulso-crm`)  
**Data:** 2026-07-21  
**Autor:** Orquestrador de Projeto PULSO CRM  
**Status:** Concluído & Verificado  

---

## 1. SUMÁRIO EXECUTIVO & DIAGNÓSTICO GERAL

Este documento apresenta o diagnóstico completo da auditoria estática do código-fonte e da árvore de componentes do **PULSO CRM**, abrangendo os módulos essenciais: **Login**, **Kanban de Oportunidades**, **Configurações**, **Dashboards** e **Mobile Nav**. Avaliou-se minuciosamente a conformidade com o **PULSO Brand Book v2.0** (estética Dark / Laranja Fogo `--signal: #f06b35`), a responsividade com Tailwind CSS v4, a usabilidade mobile/touch e a integridade das integrações com o banco de dados (Drizzle ORM + PostgreSQL) e a API da Groq (Vercel AI SDK).

### Visão Geral da Arquitetura Analisada
- **Framework & Runtime**: Next.js 16 (App Router) com TypeScript 5.
- **Estilização & Design System**: Tailwind CSS v4 (`@tailwindcss/postcss: 4.3.3`) e CSS Variables em `:root` (`globals.css`). Pacote `@pulso/ui` para primitivos visuais.
- **Banco de Dados & ORM**: Drizzle ORM com pool de conexões `node-postgres` (`pg` `Pool`) e 33 tabelas PostgreSQL mapeadas.
- **Inteligência Artificial**: Vercel AI SDK (`ai` v7 + `@ai-sdk/groq` v4) integrado à API Groq.
- **Gestão de Estado**: Arquitetura *Server-First* nativa do App Router (Server Components + Server Actions com `revalidatePath` e `useTransition`).

---

### Matriz de Severidade dos Achados

| ID | Módulo / Domínio | Classificação | Descrição Sintética |
|---|---|---|---|
| **CRIT-01** | Mobile Nav / Topbar | 🔴 **Bloqueador Crítico** | Botão hambúrguer da Topbar (`topbar.tsx:26`) é um **controle morto** (sem `onClick`, estado ou drawer modal). 80%+ das rotas do CRM ficam inalcançáveis no celular. |
| **CRIT-02** | Login / Forms (Mobile) | 🔴 **Bloqueador Crítico** | Inputs com `text-sm` (14px) provocam **auto-zoom forçado** no iOS Mobile Safari ao receber foco, distorcendo o layout da página. |
| **CRIT-03** | Groq API Integration | 🔴 **Bloqueador Crítico** | Chamada da Groq API (`ai.ts:11`) utiliza modelo legado hardcoded `llama3-70b-8192` sem tratamento de erro com retries/fallbacks. Tela de Assistente IA (`assistente/page.tsx`) é um mock estático não conectado. |
| **MED-01** | Kanban de Oportunidades | 🟡 **Deficiência Média** | Ausência total de funcionalidade **Drag-and-Drop** (movimentação feita apenas via `<select>`); colunas fixas de 320px e uso de `100vh` causam overflow vertical/horizontal no celular. |
| **MED-02** | Design Tokens & Cores | 🟡 **Deficiência Média** | Fragmentação de cor: **28 ocorrências de `#b3261e`** hardcoded (ignorando `--error`) e **25+ ocorrências de `orange-500`** (ignorando o Laranja Fogo oficial `--signal: #f06b35`). |
| **MED-03** | Dashboards & Breakpoints | 🟡 **Deficiência Média** | `TodayPage` usa `2xl:grid-cols-[1.35fr_.65fr]`, mantendo notebooks/monitores de 1366px-1440px travados em layout de 1 coluna. Gráfico de Fluxo de Caixa é feito em flexbox cru com tooltips `group-hover` inacessíveis no toque. |
| **MED-04** | Configurações Geral | 🟡 **Deficiência Média** | Página `/configuracoes/geral` é um formulário estático sem Server Action ou persistência na tabela `app_settings`. Faltam abas de navegação unificadas e gestão de equipe/usuários. |
| **LOW-01** | Ergonomia Touch (WCAG) | 🟢 **Melhoria Técnica** | Inputs (~40px), botões (~40-42px) e links de navegação secundários (~16-28px) violam a diretriz recomendada de área de toque de 44px/48px. |

---

## 2. AUDITORIA ESTRUTURAL E ANÁLISE DE COMPONENTES (R1)

### 2.1 Login & Autenticação (`apps/web/src/app/(auth)/`)
- **Arquitetura de Componentes**:
  - `(auth)/layout.tsx`: Estrutura centralizada com fundo `.public-grid`, marca PULSO e card container.
  - `(auth)/login/page.tsx`: Implementa login via `authClient.signIn.email`.
- **Desvios e Problemas Detectados**:
  1. **Bypass de Primitivos de UI**: O formulário re-implementa estilos de input inline (`border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5`) em vez de importar os primitivos `<Input>`, `<Label>` e `<Button>` de `@pulso/ui`.
  2. **Auto-Zoom no iOS Safari**: A classe `text-sm` (14px) faz com que o iOS Safari aplique zoom automático no campo quando o usuário toca para digitar em iPhones.
  3. **Touch Targets Reduzidos**: A classe `.primary-button` (`globals.css:18`) define `min-height: 42px` (abaixo dos 44px/48px exigidos pelas diretrizes WCAG 2.2 e Apple Human Interface Guidelines). O link "Esqueci minha senha" possui altura de toque útil de apenas ~20px.
  4. **Cor Hardcoded**: Erros de validação usam a cor hexadecimal `#b3261e` diretamente na linha 53, ignorando o token CSS `--error: #e35c5c`.
  5. **Navegação com `<a>` Nativo**: Uso de `<a>` em vez de `<Link>` do Next.js nas rotas de autenticação, causando *full page reload*.

---

### 2.2 Kanban de Oportunidades (`apps/web/src/app/(crm)/app/comercial/oportunidades/`)
- **Arquitetura de Componentes**:
  - `oportunidades/page.tsx`: Renderiza colunas do pipeline e cards de oportunidade.
  - `stage-select.tsx`: Componente de alteração de estágio de oportunidade.
- **Desvios e Problemas Detectados**:
  1. **Ausência de Drag-and-Drop (DND)**: O sistema **não possui** biblioteca ou manipulador de arrastar e soltar (HTML5 DND, `@hello-pangea/dnd` ou `dnd-kit`). A movimentação dos cards entre etapas é feita exclusivamente alterando um elemento `<select>` no rodapé do card (`<StageSelect>`).
  2. **Subutilização de UI Primitives**: O `<StageSelect>` estiliza um `<select>` nativo com CSS inline em vez de usar o primitivo `<Select>` do `@pulso/ui`.
  3. **Incompatibilidade Viewport Mobile**: O container usa `h-[calc(100vh-6rem)]`. Em navegadores mobile onde a barra de endereço encolhe/expande dinamicamente, `100vh` causa estouro vertical e rolagem dupla. O correto é usar `100dvh`.
  4. **Largura Fixa de Colunas**: As colunas possuem largura fixa `w-[320px] shrink-0`. Em visores de 320px a 360px, a coluna de 320px somada aos 32px de padding do pai resulta em 352px, forçando rolagem horizontal imediata até para ver 1 única coluna. Falta um modo mobile de alternância de colunas por abas.

---

### 2.3 Configurações (`apps/web/src/app/(crm)/app/configuracoes/`)
- **Arquitetura de Componentes**:
  - `/configuracoes/geral/page.tsx`: Formulário de dados da empresa e personalização.
  - `/configuracoes/integracoes/page.tsx` & `telegram-card.tsx`: Status de integrações.
  - `/configuracoes/seguranca/page.tsx`: Sessões ativas e autenticação.
- **Desvios e Problemas Detectados**:
  1. **Formulário Desconectado (Mock)**: A página `configuracoes/geral/page.tsx` renderiza um formulário puramente estático. Não existe Server Action ou chamada de banco para salvar as alterações do CRM.
  2. **Ausência de Layout de Abas Unificado**: Não há uma barra de navegação compartilhada entre as rotas de configurações; cada página renderiza seu próprio `<PageHeader>` isolado.
  3. **Módulo de Gestão de Equipe Ausente**: Não existe sub-página ou funcionalidade para cadastrar usuários, convidar membros ou gerenciar papéis/permissões.
  4. **Incoerência de Temas em Integrações**: O arquivo `telegram-card.tsx` (linhas 66, 71) utiliza caixas verdes e vermelhas com cores de modo claro (`bg-green-50 text-green-800`, `bg-red-50 text-red-800`), criando caixas brancas/claras discrepantes no layout escuro do CRM.
  5. **Bypass de Tokens de Marca**: Uso de `bg-orange-500` e `#F97316` em vez do token `--signal` (`#f06b35`).

---

### 2.4 Dashboards (`apps/web/src/app/(crm)/app/hoje/`, `financeiro/visao/`, `inteligencia/relatorios/`)
- **Arquitetura de Componentes**:
  - `hoje/page.tsx`: Central de métricas do dia, tarefas atrasadas e alertas.
  - `financeiro/visao/page.tsx`: Dashboard financeiro e gráfico de fluxo de caixa.
  - `inteligencia/relatorios/page.tsx`: Relatórios consolidados comerciais e operacionais.
- **Desvios e Problemas Detectados**:
  1. **Gráfico Flexbox sem Biblioteca**: O gráfico de Fluxo de Caixa (`financeiro/visao/page.tsx:145-170`) foi construído manualmente empilhando elementos `<div>` com porcentagens de altura inline (`style={{ height: `${height}%` }}`). Falta o uso de uma biblioteca de gráficos profissional como Recharts.
  2. **Tooltips Inacessíveis em Touch**: Os tooltips do gráfico dependem da classe Tailwind `group-hover:opacity-100 pointer-events-none`, tornando impossível inspecionar os valores numéricos em telas sensíveis ao toque (smartphones/tablets).
  3. **Breakpoint `2xl:` Inadequado**: A grid principal da `TodayPage` usa `2xl:grid-cols-[1.35fr_.65fr]`. Como `2xl:` ativa apenas a partir de 1536px, notebooks de 1366px e 1440px exibem a página em uma única coluna vertical gigante.

---

### 2.5 Mobile Nav & Topbar (`apps/web/src/components/mobile-nav.tsx`, `topbar.tsx`, `sidebar.tsx`)
- **Arquitetura de Componentes**:
  - `sidebar.tsx`: Menu lateral completo (possui `hidden lg:flex`, oculta-se em <1024px).
  - `mobile-nav.tsx`: Barra fixa inferior para telas móveis com 5 links principais.
  - `topbar.tsx`: Barra superior com campo de busca e botão de menu hambúrguer.
- **Desvios e Problemas Detectados**:
  1. **Falha Crítica do Menu Hambúrguer**: O botão `<button className="... lg:hidden"><Menu className="size-4" /></button>` em `topbar.tsx:26` **não possui handler `onClick`**, estado ou componente de *drawer* associado.
  2. **Bloqueio de Acesso às Rotas do CRM**: Como a `Sidebar` oculta-se em telas <1024px e a `MobileNav` exibe apenas 5 links (`Hoje`, `Oportunidades`, `Projetos`, `Financeiro`, `Buscar`), mais de 20 telas e recursos (Leads, Briefings, Propostas, Contratos, Relatórios, Configurações, etc.) ficam **totalmente inacessíveis no celular**.

---

## 3. AUDITORIA DE DESIGN TOKENS, RESPONSIVIDADE E INTEGRAÇÕES (R1)

### 3.1 Design Tokens & Consistência Visual (PULSO Brand Book v2.0)

O sistema define os tokens no arquivo `apps/web/src/app/globals.css`:
```css
:root {
  --paper: #11110f;
  --surface: #191917;
  --surface-raised: #22221f;
  --carbon: #f4f2ed;
  --signal: #f06b35; /* Laranja Fogo Oficial PULSO */
  --muted: #aaa79f;
  --muted-strong: #d6d2ca;
  --neutral: #56534e;
  --line: #32312d;
  --soft: #25241f;
  --success: #3da873;
  --warning: #f0a934;
  --error: #e35c5c;
  --info: #4a8fd1;
}
```

#### Diagnosticadas duas graves anomalias de tokenizacao:
1. **Proliferação da cor `#b3261e`**: Encontradas **28 ocorrências** do hexadecimal `#b3261e` espalhadas pelo código (`login/page.tsx`, `onboarding/steps.tsx`, `redefinir-senha/page.tsx`, `briefings/novo/forms.tsx`, `contratos/[id]/page.tsx`, `propostas/[id]/editor.tsx`, etc.). Os componentes ignoram a variável oficial de erro `--error: #e35c5c`.
2. **Desvio do Laranja Fogo PULSO**: Encontradas **25+ ocorrências** da classe Tailwind `orange-500` (`#f97316`) e `text-orange-500` / `bg-orange-500` no lugar do token oficial `--signal` (`#f06b35`), gerando variações indesejadas na tonalidade da marca.

---

### 3.2 Responsividade Tailwind & Ergonomia Touch

1. **Meta Viewport Incompleta**: O arquivo `apps/web/src/app/layout.tsx` omite `width=device-width`, `initial-scale=1` e `viewport-fit=cover`, prejudicando a adaptação em dispositivos com *notch* (iPhones modernos).
2. **Touch Targets Sub-WCAG**:
   - `.primary-button`: `min-height: 42px` (meta: 44px/48px).
   - Primitivos `Input` e `Select` em `@pulso/ui`: `py-2.5 text-sm` (~40px de altura total).
   - Links secundários e botões de ação inline: altura de toque útil de 16px a 28px.

---

### 3.3 Integridade do Banco de Dados & API Groq

#### A. API Groq & Inteligência Artificial (`apps/web/src/lib/ai.ts`)
- **Implementação**: Instancia `createGroq` da Vercel AI SDK e utiliza `generateObject` com validação Zod para estruturar propostas comerciais a partir de briefings.
- **Segurança da Chave**: A variável `GROQ_API_KEY` é consumida estritamente no servidor (`process.env.GROQ_API_KEY`). Nenhuma chave é exposta no client bundle.
- **Pontos de Risco**:
  1. **Modelo Legado Hardcoded**: O código especifica `model: groq("llama3-70b-8192")`. A Groq atualizou seus identificadores para `llama-3.3-70b-versatile` e `llama-3.1-70b-versatile`. Manter o modelo legado traz risco imediato de interrupção do serviço.
  2. **Ausência de Resiliência**: Não há tratamento para estouro de limite de taxa (`429 Too Many Requests`), falta *exponential backoff*, timeout configurado e modelo de fallback (ex: `llama3-8b-8192`).
  3. **Interface Desconectada**: A página `/app/inteligencia/assistente` é um mock estático sem integração com o backend.

#### B. Banco de Dados & ORM (`packages/database/`)
- **Desempenho & Conexões**: Excelente gerenciamento de pool (`pg` `Pool`) com limite de 20 conexões em produção e preservação de instância global em ambiente de desenvolvimento (`globalForDb.pulsoPool`).
- **Tipagem & Schema**: 33 tabelas PostgreSQL mapeadas via Drizzle ORM com exportação integral de tipos TypeScript (`$inferSelect`).
- **Eficiência de Consulta**: A Central de Hoje (`today-data.ts`) executa 9 consultas paralelas via `Promise.all` em campos indexados (`status`, `dueDate`, `createdAt`), evitando gargalos N+1.

---

## 4. PLANO ESTRUTURADO DE MELHORIA CONTÍNUA E PROPOSTAS DE REFATORAÇÃO (R2)

### 4.1 Refatorações Propostas para Web

#### PROPOSTA W1: Implementação de Drag-and-Drop Nao-Bloqueante no Kanban
- **Objetivo**: Integrar biblioteca de Drag-and-Drop moderna (`dnd-kit` ou `@hello-pangea/dnd`) mantendo o `<StageSelect>` como fallback de acessibilidade/mobile.
- **Plano de Implementação**:
  1. Instalar `@hello-pangea/dnd` ou `@dnd-kit/core`.
  2. Envolver a grid de colunas em um `DragDropContext` e cada card em um `Draggable`.
  3. No evento `onDragEnd`, disparar otimisticamente a Server Action `moveOpportunityStage` com `useTransition`.

#### PROPOSTA W2: Padronizacao do Design System e Substituição de Cores Hardcoded
- **Objetivo**: Eliminar os 28 hexadecimais `#b3261e` e substituir as classes `orange-500` pelo token `--signal` (`#f06b35`).
- **Plano de Implementação**:
  1. Atualizar `@pulso/ui` para utilizar variáveis CSS nativas em todos os primitivos.
  2. Substituir ocorrências de `#b3261e` pelo token `var(--error)` (`#e35c5c`).
  3. Garantir a utilização do primitivo `<Input>` e `<Button>` em todas as telas de autenticação e formulários do CRM.

#### PROPOSTA W3: Conexão dos Formulários Estáticos e Atualização do Groq API Client
- **Objetivo**: Conectar a página de Configurações Geral ao banco e atualizar a integração com a Groq API.
- **Plano de Implementação**:
  1. Criar Server Action `updateGeralSettings` conectada à tabela `schema.appSettings`.
  2. Atualizar o modelo no `ai.ts` para `groq("llama-3.3-70b-versatile")` e adicionar wrapper com retries e modelo de reserva (`llama-3.1-8b-instant`).
  3. Conectar a tela do Assistente IA (`assistente/page.tsx`) a um endpoint de streaming com Vercel AI SDK (`useChat`).

#### PROPOSTA W4: Migração de Gráficos do Dashboard para Recharts
- **Objetivo**: Substituir o gráfico em flexbox de `financeiro/visao` por componentes declarativos da biblioteca Recharts.
- **Plano de Implementação**:
  1. Instalar `recharts`.
  2. Criar componente reutilizável `<CashFlowChart />` responsivo com suporte a toque e tooltips nativos.

---

### 4.2 Refatorações Propostas para Mobile

#### PROPOSTA M1: Implementação do Mobile Drawer Sheet na Topbar
- **Objetivo**: Tornar todas as 20+ rotas do CRM acessíveis em telas menores que 1024px.
- **Plano de Implementação**:
  1. Criar o componente `<MobileMenuDrawer />` utilizando o primitivo Sheet/Dialog de `@pulso/ui`.
  2. Conectar o handler `onClick` do botão de menu hambúrguer na Topbar (`topbar.tsx:26`) para abrir o drawer.
  3. Renderizar dentro do drawer a estrutura completa de links da `Sidebar`.

#### PROPOSTA M2: Eliminação do Bug de Auto-Zoom no iOS e Adequação WCAG Touch
- **Objetivo**: Garantir experiência mobile fluida sem distorções visuais e com toque preciso.
- **Plano de Implementação**:
  1. Ajustar o tamanho base de fonte dos inputs em telas mobile para `text-base` (16px) ou aplicar classe condicional `text-base sm:text-sm`.
  2. Elevar a altura mínima de toque da classe `.primary-button` e dos componentes `<Input>` / `<Button>` para `min-h-[44px]` (48px recomendado).
  3. Adicionar padding de toque em links inline e botões secundários.

#### PROPOSTA M3: Otimização do Layout do Kanban no Celular
- **Objetivo**: Garantir que o Kanban funcione perfeitamente em telas pequenas (<375px).
- **Plano de Implementação**:
  1. Alterar a altura do container de `100vh` para `100dvh`.
  2. Adicionar uma barra de abas mobile no topo do Kanban permitindo alternar visualmente entre os estágios (ex: `[ Novos (3) ] [ Em Contato (5) ] [ Proposta (2) ]`), exibindo 1 coluna por vez em celulares e a grid horizontal em tablets/desktops.

---

## 5. ROADMAP EVOLUTIVO DE ARQUITETURA E DESENVOLVIMENTO

```
+-----------------------------------------------------------------------------------+
| FASE 1: Estabilização Crítica (Sprints 1 - 2)                                     |
|  - Implementar Mobile Drawer Sheet no botão hambúrguer da Topbar                  |
|  - Ajustar font-size dos inputs para 16px no mobile (eliminar auto-zoom iOS)      |
|  - Atualizar modelo Groq API no ai.ts para llama-3.3-70b-versatile + retries     |
|  - Conectar formulário de Configurações Geral ao banco via Server Action          |
+-----------------------------------------------------------------------------------+
                                        │
                                        ▼
+-----------------------------------------------------------------------------------+
| FASE 2: Ergonomia & Padronização de Design Tokens (Sprints 3 - 4)                 |
|  - Substituir 28 ocorrências de #b3261e por var(--error)                          |
|  - Substituir orange-500 por var(--signal) Flame Orange                           |
|  - Padronizar touch targets para mínimo 44px/48px WCAG                            |
|  - Re-alinhar breakpoint da grid da TodayPage de 2xl: para xl: (1280px)           |
+-----------------------------------------------------------------------------------+
                                        │
                                        ▼
+-----------------------------------------------------------------------------------+
| FASE 3: Interatividade Avançada & Dashboards (Sprints 5 - 6)                      |
|  - Implementar Drag-and-Drop nativo no Kanban com @hello-pangea/dnd               |
|  - Refatorar gráficos do Financeiro para Recharts com suporte a touch             |
|  - Conectar Assistente IA a endpoint de streaming conversacional (useChat)        |
|  - Implementar modo de abas mobile no Kanban para telas <375px                    |
+-----------------------------------------------------------------------------------+
                                        │
                                        ▼
+-----------------------------------------------------------------------------------+
| FASE 4: Expansão & Funcionalidades Avançadas (Sprints 7+)                         |
|  - Criar módulo completo de Gestão de Equipe, Usuários e Permissões em Settings   |
|  - Implementar suporte PWA e caching offline para uso mobile em campo             |
|  - Automatizar relatórios executivos agendados com integração Telegram            |
+-----------------------------------------------------------------------------------+
```

---

## 6. CONCLUSÃO

A auditoria estática comprova que o **PULSO CRM** possui uma base técnica moderna e de altíssimo nível, impulsionada pelo Next.js 16, Drizzle ORM e Tailwind CSS v4. No entanto, a identificação de **bloqueadores críticos no acesso mobile** e a **fragmentação de tokens de design** exigiam um plano claro de refatoração.

Com a execução do plano detalhado acima, o PULSO CRM atingirá excelência em usabilidade mobile, conformidade estrita com o Brand Book v2.0 e resiliência arquitetural.
