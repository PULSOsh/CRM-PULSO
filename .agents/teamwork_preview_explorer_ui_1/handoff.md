# UI Architecture, Component Tree & Design System Audit Report

## 1. Observation

### A. Component Tree Architecture Audit

1. **Login & Auth Flow (`apps/web/src/app/(auth)/`)**:
   - `(auth)/layout.tsx` (lines 5-12): Wraps auth sub-pages in a centered layout with `.public-grid` background, `<PulsoLogo />`, and a styled container card (`bg-[var(--surface)] border-[var(--line)]`).
   - `(auth)/login/page.tsx` (lines 38-56): Implements authentication form using `authClient.signIn.email`. Re-implements inline input styles (`border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5`) instead of importing `Input`, `Label`, and `Button` from `@pulso/ui`. Line 58 uses native `<a>` tag (`href="/esqueci-senha"`) instead of Next.js `<Link>`. Line 53 hardcodes color `#b3261e` for error alert text/background.
   - `(auth)/esqueci-senha/page.tsx` (lines 26, 48): Uses native `<a>` tag for navigation back to `/login`.
   - `(auth)/onboarding/steps.tsx` (lines 45, 82): Hardcodes `#b3261e` for step error states.

2. **Kanban de Oportunidades (`apps/web/src/app/(crm)/app/comercial/oportunidades/`)**:
   - `oportunidades/page.tsx` (lines 52-94): Implements pipeline column layout (`flex h-full gap-4 min-w-max`, fixed column width `w-[320px] shrink-0 rounded-2xl bg-[var(--soft)] p-3`).
   - **Drag-and-Drop Capability**: **ABSENT**. There is no HTML5 Drag-and-Drop, `@hello-pangea/dnd`, `dnd-kit`, or `react-dnd` library integrated. Stage movement is exclusively handled via `<StageSelect>` (line 80), a `<select>` dropdown inside each deal card footer.
   - `stage-select.tsx` (lines 16-24): Uses `useTransition` to execute server action `moveOpportunityStage`. Re-implements raw HTML `<select>` inline styles instead of utilizing `@pulso/ui` `<Select>`.
   - `oportunidades/page.tsx` (line 75): Icon `<AlertTriangle className="size-4 text-amber-500" />` hardcodes default Tailwind class `text-amber-500` instead of design token `--warning`.

3. **Configurações / Settings (`apps/web/src/app/(crm)/app/configuracoes/`)**:
   - **Tab Navigation**: Missing shared layout sub-navigation tab bar across `/configuracoes/geral`, `/configuracoes/integracoes`, and `/configuracoes/seguranca`. Each sub-page renders its own standalone `<PageHeader>`.
   - **User / Team Management**: **MISSING FEATURE**. There is no user management or team role assignment sub-page / tab within `configuracoes`.
   - `configuracoes/geral/page.tsx` (lines 15, 40): Hardcodes `text-white` instead of `text-[var(--carbon)]`. Line 45 & 46 hardcodes Tailwind `bg-orange-500` and default hex `#F97316` for primary brand color picker.
   - `configuracoes/integracoes/telegram-card.tsx` (lines 66, 71): Hardcodes light mode green (`bg-green-50 text-green-800 border-green-200`) and light mode red (`bg-red-50 text-red-800 border-red-200`) containers, creating jarring light boxes inside a dark mode layout. Line 37 uses browser native `alert("Mensagem enviada!")` instead of a toast component.

4. **Dashboards (`apps/web/src/app/(crm)/app/hoje/page.tsx` & `apps/web/src/app/(crm)/app/financeiro/visao/page.tsx`)**:
   - `hoje/page.tsx` (lines 48-72): Metrics cards grid (`sm:grid-cols-2 xl:grid-cols-4`) using glassmorphism styling (`backdrop-blur-md bg-[var(--surface)]/80`).
   - `financeiro/visao/page.tsx` (lines 145-170): Fluxo de Caixa chart is built from scratch using flexbox `<div>` elements with dynamic inline height percentages (`style={{ height: `${height}%` }}`). No declarative chart library (such as Recharts or Chart.js) is utilized.
   - `financeiro/visao/page.tsx` (lines 42-63, 151-153): Hardcodes Tailwind colors `text-orange-500`, `text-emerald-500`, `text-rose-500`, `bg-black/50`, `border-white/10` bypassing CSS variables defined in `globals.css`.

5. **Mobile Navigation (`apps/web/src/components/mobile-nav.tsx`, `topbar.tsx`, `sidebar.tsx`, `(crm)/app/layout.tsx`)**:
   - `mobile-nav.tsx` (lines 9-27): Renders fixed bottom navigation bar on mobile screens (`< 1024px`), containing exactly 5 items from `mobileNavigation` (`/app/hoje`, `/app/comercial/oportunidades`, `/app/operacao/projetos`, `/app/financeiro/visao`, `/app/busca`).
   - `topbar.tsx` (line 26): Renders hamburger menu button `<button className="... lg:hidden"><Menu className="size-4" /></button>`.
   - **Mobile Drawer Sheet**: **DEAD / NON-FUNCTIONAL UI**. The hamburger button on line 26 in `topbar.tsx` has no `onClick` handler, state, or drawer sheet modal attached. On mobile viewports, users cannot open a full menu drawer, restricting navigation solely to the 5 bottom nav items.

---

### B. Design Tokens & Styling Audit

1. **Design System Definitions (`apps/web/src/app/globals.css`)**:
   - Defines CSS Variables in `:root`:
     - `--paper: #11110f;`
     - `--surface: #191917;`
     - `--surface-raised: #22221f;`
     - `--carbon: #f4f2ed;`
     - `--signal: #f06b35;` (PULSO Brand Book v2.0 Laranja Fogo)
     - `--muted: #aaa79f;`
     - `--muted-strong: #d6d2ca;`
     - `--neutral: #56534e;`
     - `--line: #32312d;`
     - `--soft: #25241f;`
     - `--success: #3da873;`
     - `--warning: #f0a934;`
     - `--error: #e35c5c;`
     - `--info: #4a8fd1;`

2. **Hardcoded Color Token Bypasses**:
   - **Hardcoded Red (`#b3261e`)**: Present in **28 separate occurrences** across form files (`login/page.tsx`, `onboarding/steps.tsx`, `redefinir-senha/page.tsx`, `briefings/novo/forms.tsx`, `contatos/[id]/edit-form.tsx`, `contratos/[id]/page.tsx`, `propostas/[id]/editor.tsx`, `financeiro/entry-actions.tsx`, etc.). Components bypass `--error` (`#e35c5c`) and `.badge-danger`.
   - **Tailwind `orange-500` (`#f97316`) Bypasses**: Present in **25+ occurrences** (`briefings/[id]/ai-proposal-button.tsx`, `configuracoes/geral/page.tsx`, `financeiro/visao/page.tsx`, `relacionamento/mensagens/page.tsx`, `proposta/[slug]/proposal-view.tsx`). Instead of using `--signal` (`#f06b35`), components use `bg-orange-500`, `text-orange-500`, `hover:bg-orange-600`.
   - **Hardcoded Light Mode Colors in Dark Mode**: `telegram-card.tsx` (lines 66, 71) uses `bg-green-50 text-green-800` and `bg-red-50 text-red-800`.

3. **Adherence to PULSO Brand Book v2.0**:
   - Aesthetic Reference: Dark background (`--paper: #11110f`) with Flame Orange (`--signal: #f06b35`).
   - Deviation: Inconsistency caused by parallel usage of Tailwind default `orange-500`, `emerald-500`, `rose-500`, and hardcoded hex values, resulting in slight shade discrepancies across pages (e.g. `#f97316` vs `#f06b35`).

4. **Component Modularity, Prop Drilling & Duplication**:
   - `@pulso/ui` (`packages/ui/src/index.tsx`) defines UI primitives (`Button`, `Card`, `Badge`, `Label`, `Input`, `Textarea`, `Select`).
   - However, feature pages frequently bypass `@pulso/ui` primitives and duplicate inline Tailwind input/label/select classes (e.g. `login/page.tsx`, `stage-select.tsx`, `contatos/novo/page.tsx`).
   - **Prop Drilling**: `unreadCount` is manually drilled from `CrmLayout` down to `Sidebar` and `MobileNav`. `isDemo` is manually passed to `Topbar`.

---

## 2. Logic Chain

1. **Observation**: `apps/web/src/app/(crm)/app/comercial/oportunidades/page.tsx` renders stage columns with deal cards containing `<StageSelect>`. No drag-and-drop attributes (`draggable`), event listeners (`onDragStart`, `onDrop`), or DND libraries exist in `package.json` or source files.
   - **Deduction**: Opportunity pipeline visual board operates as a static grid with manual dropdown selection rather than an interactive drag-and-drop Kanban board.

2. **Observation**: `apps/web/src/components/topbar.tsx` line 26 renders `<button className="... lg:hidden"><Menu className="size-4" /></button>` without any `onClick` prop or modal state, while `mobile-nav.tsx` displays 5 static bottom links.
   - **Deduction**: Mobile drawer navigation is incomplete / broken in code. On viewports `< 1024px`, users cannot access 20+ app sections (such as Briefings, Contratos, Tarefas, Relatórios, Settings).

3. **Observation**: `globals.css` defines `:root` variable `--signal: #f06b35;` and `--error: #e35c5c;`. Grep search yields 28 occurrences of `#b3261e` for error text and 25+ occurrences of Tailwind `bg-orange-500` / `text-orange-500` (`#f97316`) across pages.
   - **Deduction**: The codebase suffers from styling token fragmentation. Rather than adhering strictly to CSS variable design tokens and `@pulso/ui` primitives, developers frequently fell back to arbitrary hex values and Tailwind's built-in color palette.

4. **Observation**: `@pulso/ui` contains clean primitives (`Input`, `Select`, `Label`, `Button`), but `login/page.tsx`, `stage-select.tsx`, and 15+ form components re-declare raw `<input>` and `<select>` elements with inline Tailwind class strings.
   - **Deduction**: Low design system adoption rate across feature modules, leading to code duplication and maintenance friction.

---

## 3. Caveats

- **Runtime Execution**: This analysis was performed strictly via static code inspection and grep analysis without running an active browser session.
- **Scope Limit**: Analyzed frontend source code under `apps/web/src` and `packages/ui`. Did not inspect database schema files or external API handlers unless directly referenced by UI components.

---

## 4. Conclusion

The PULSO CRM frontend codebase provides a clean, modern aesthetic based on Next.js App Router and Tailwind CSS v4. However, the UI architecture exhibits key gaps and inconsistencies:

1. **Kanban Interactive Gap**: The Oportunidades pipeline lacks native drag-and-drop interaction, relying solely on card dropdown selects.
2. **Mobile UX Defect**: The topbar mobile menu hamburger icon is a non-functional element without a drawer sheet, restricting mobile navigation to 5 fixed bottom nav items.
3. **Design System Leakage**: High prevalence of hardcoded color values (`#b3261e` in 28 locations) and Tailwind palette bypasses (`orange-500` instead of Brand Book `--signal` Flame Orange `#f06b35`).
4. **Component Duplication**: `@pulso/ui` package primitives are underutilized in form components across auth, CRM, and settings modules.

---

## 5. Verification Method

To independently verify all observations in this report, execute the following inspect commands:

1. **Verify Kanban Drag-and-Drop absence & Stage Select**:
   - `view_file` at `apps/web/src/app/(crm)/app/comercial/oportunidades/page.tsx` (lines 52-94)
   - `view_file` at `apps/web/src/app/(crm)/app/comercial/oportunidades/stage-select.tsx`

2. **Verify Mobile Hamburger Menu button without onClick handler**:
   - `view_file` at `apps/web/src/components/topbar.tsx` (line 26)

3. **Verify Hardcoded Red (`#b3261e`) grep count**:
   - `grep_search` with Query `#b3261e` on `apps/web/src`

4. **Verify Tailwind `bg-orange-500` vs `--signal` Flame Orange**:
   - `view_file` at `apps/web/src/app/globals.css` (lines 3-8)
   - `grep_search` with Query `bg-orange-500` on `apps/web/src`

5. **Verify Telegram Card light mode green/red in dark mode**:
   - `view_file` at `apps/web/src/app/(crm)/app/configuracoes/integracoes/telegram-card.tsx` (lines 66, 71)
