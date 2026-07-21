# Static Analysis Report: Tailwind CSS Responsiveness & Mobile UI/UX Audit

**Target Project:** PULSO CRM (`d:\PULSO\PULSO_CRM_NOVA_BASE\pulso-crm`)  
**Agent ID:** `teamwork_preview_explorer_mobile_1`  
**Date:** 2026-07-21  

---

## 1. Observation

### A. Breakpoints & Layout Architecture
- **Tailwind Version**: Tailwind CSS v4.3.3 (`@tailwindcss/postcss: 4.3.3` in `apps/web/package.json:25` and `@import "tailwindcss";` in `apps/web/src/app/globals.css:1`). Standard breakpoints active (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`).
- **CRM Root Layout Shell (`apps/web/src/app/(crm)/app/layout.tsx:22-28`)**:
  - Outer container: `<div className="min-h-screen lg:flex">`.
  - Main section: `<main className="mx-auto w-full max-w-[1600px] p-4 pb-24 md:p-6 lg:p-8">{children}</main>`.
  - Body padding rule (`apps/web/src/app/globals.css:33`): `@media(max-width:1023px){body{padding-bottom:64px}}`.
  - Viewport configuration in `apps/web/src/app/layout.tsx:9`: `export const viewport: Viewport = { themeColor: "#11110f", colorScheme: "dark light" };`. Standard `width="device-width"`, `initial-scale=1`, `viewport-fit=cover` definitions for notch safe-area handling are omitted.

### B. Mobile Navigation & Topbar / Drawer Gap
- **Mobile Navigation (`apps/web/src/components/mobile-nav.tsx:9-27`)**:
  - `<nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--line)] bg-[var(--surface)] px-1 pb-[env(safe-area-inset-bottom)] lg:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">`.
  - Item height: `min-h-16` (64px) -> satisfies 44px/48px touch target guidelines.
  - Links available (`apps/web/src/lib/nav.ts:53-59`): `Central de hoje` (`/app/hoje`), `Oportunidades` (`/app/comercial/oportunidades`), `Projetos` (`/app/operacao/projetos`), `Visão financeira` (`/app/financeiro/visao`), `Buscar` (`/app/busca`).
- **Sidebar (`apps/web/src/components/sidebar.tsx:24`)**: `<aside className="hidden h-screen shrink-0 ... lg:sticky lg:top-0 lg:flex lg:flex-col ...">` -> completely hidden on mobile viewports (<1024px).
- **Topbar Hamburger Button (`apps/web/src/components/topbar.tsx:26`)**:
  - `<button className="grid size-9 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] lg:hidden"><Menu className="size-4" /></button>`.
  - **Dead Control**: Button contains `<Menu className="size-4" />` but has **no `onClick` handler**, state, or drawer trigger.
  - **Unreachable Sections on Mobile**: Users on mobile devices (<1024px) cannot access 20+ sections (Leads, Prospecção, Contatos, Briefings, Propostas, Contratos, Produtos, Tarefas, Aprovações, Arquivos, Horas, Suporte, Receber, Pagar, Recorrentes, Finanças Pessoais, Relatórios, Assistente, Notificações, Configurações) because the sidebar is hidden and the hamburger menu button has no drawer attached.

### C. Login & Auth Pages (`apps/web/src/app/(auth)/login/page.tsx`, `layout.tsx`)
- **Card Padding**: `apps/web/src/app/(auth)/layout.tsx:8`: `rounded-2xl border ... p-6 sm:p-8`. Adapts smoothly from `p-6` (mobile) to `p-8` (`sm:`).
- **Form Inputs (`apps/web/src/app/(auth)/login/page.tsx:42, 50`)**:
  - Input styling: `px-3.5 py-2.5 text-sm`. Height = ~40px (under WCAG/iOS 44px/48px standard).
  - **iOS Mobile Safari Auto-Zoom Bug**: Input font size is `text-sm` (14px). iOS Safari automatically triggers viewport zoom on any input focus where `font-size < 16px`.
- **Button Touch Height**: `.primary-button` (`apps/web/src/app/globals.css:18`) defines `min-height: 42px;` (under 44px/48px requirement).
- **"Esqueci minha senha" Link (`apps/web/src/app/(auth)/login/page.tsx:58`)**: `mt-4 block text-center text-sm font-bold` lacks vertical padding, resulting in a ~20px high touch target.

### D. Kanban Responsiveness & Ergonomics (`apps/web/src/app/(crm)/app/comercial/oportunidades/page.tsx`)
- **Viewport Height Containment (`oportunidades/page.tsx:28`)**:
  - `<div className="flex h-[calc(100vh-6rem)] flex-col">`.
  - Using `100vh` on mobile browsers (Safari/Chrome) creates vertical overflow and double-scrollbars because address bars alter `vh`. Missing `100dvh`.
- **Column Layout (`oportunidades/page.tsx:52-55`)**:
  - Container: `<div className="flex-1 overflow-x-auto overflow-y-hidden pb-4"><div className="flex h-full gap-4 min-w-max">`.
  - Columns: `<div className="flex flex-col w-[320px] shrink-0 rounded-2xl bg-[var(--soft)] p-3 border ...">`.
  - On viewports <375px (e.g. 320px, 360px), a `320px` column + `p-4` (32px) parent padding totals `352px`, forcing horizontal scroll even for a single column.
  - No mobile column stacking toggle or tab navigation mode exists.
- **Card Interactivity & Touch Targets (`oportunidades/page.tsx:65-82`, `stage-select.tsx:16-21`)**:
  - Card `<Link>` wraps title and details. Stage selector (`StageSelect`) sits inside card footer (`py-1.5 text-xs select` ~28px height).
  - Stage dropdown uses `onClick={(e) => e.stopPropagation()}`, but small target height (~28px) makes accidental navigation taps frequent on touch screens.
  - No drag-and-drop support (uses fallback `<select>`).

### E. Configurações & Form Ergonomics (`apps/web/src/app/(crm)/app/configuracoes/geral/page.tsx`, `packages/ui/src/index.tsx`)
- **Grid Stacking**: `apps/web/src/app/(crm)/app/configuracoes/geral/page.tsx:13` uses `mt-8 grid gap-8 lg:grid-cols-2`. Correctly stacks into 1 column on `<1024px` viewports.
- **Shared UI Inputs (`packages/ui/src/index.tsx:42-65`)**:
  - `Input`, `Textarea`, `Select`: `px-4 py-2.5 text-sm` (~40px height, 14px font-size).
  - `Button`: `px-4 py-2.5 text-sm` (~40px height).
  - All shared text inputs share the iOS Safari 14px auto-zoom issue.
- **Secondary Action Buttons (`apps/web/src/components/integration-card.tsx:19`)**: `<button className="mt-2 text-xs font-bold ...">Pular e configurar depois</button>` lacks touch padding (~16px touch height).

### F. Dashboards & Chart Scaling (`apps/web/src/app/(crm)/app/hoje/page.tsx`, `inteligencia/relatorios/page.tsx`, `financeiro/visao/page.tsx`)
- **Central de Hoje (`hoje/page.tsx:33, 48, 74`)**:
  - Unread notification banner (`hoje/page.tsx:35`): `flex items-center gap-4` on mobile <390px causes text and action button to squeeze awkwardly horizontally. Missing `flex-col sm:flex-row`.
  - Main grid (`hoje/page.tsx:74`): `grid gap-8 2xl:grid-cols-[1.35fr_.65fr]`. Uses `2xl:` (1536px+). On laptops/monitors between `1024px` and `1535px`, dashboard stays stacked in 1 single column instead of 2 columns.
- **Finance Overview Cash Flow Chart (`financeiro/visao/page.tsx:145-169`)**:
  - Container: `<div className="flex h-56 items-end gap-2 sm:gap-3 px-1 sm:px-2">`.
  - 14 daily bars in a flex row. On 320px-360px viewports, bar widths shrink to ~13px each with `gap-2` (8px).
  - Hover Tooltips (`financeiro/visao/page.tsx:158`): `group-hover:opacity-100 pointer-events-none`. On mobile touch screens without hover state, tooltips cannot be inspected reliably.
- **Relatórios Page Accessibility & Scaling (`inteligencia/relatorios/page.tsx:173-253`)**:
  - Excellent use of WAI-ARIA (`aria-label`, `aria-current`, `aria-hidden`, `aria-labelledby`, `role`).
  - Metric cards use `break-words text-3xl tabular-nums` which handles monetary values cleanly across viewports.

---

## 2. Logic Chain

1. **Mobile Drawer Unreachability Logic**:
   - Observation: `Sidebar` has `hidden lg:flex` (hidden on screens <1024px). `MobileNav` bottom bar displays only 5 destination links. The Topbar hamburger `<button className="lg:hidden"><Menu /></button>` has no `onClick` handler or drawer component attached.
   - Deduction: Users on screens <1024px are strictly locked into only 5 routes. Over 20 admin, financial, operational, and settings routes are completely unreachable on mobile devices.

2. **iOS Safari Viewport Zoom Logic**:
   - Observation: `Input` components across `@pulso/ui` and page forms (`login`, `onboarding`, `configuracoes`) use `text-sm` (14px).
   - Deduction: Mobile Safari (iOS) automatically zooms into page inputs whenever focused if `font-size < 16px`. This forces horizontal viewport distortion and breaks responsive framing on all iPhones.

3. **Kanban Mobile Usability Logic**:
   - Observation: Kanban board uses `h-[calc(100vh-6rem)]` container, `w-[320px]` fixed column width, and `min-w-max` flex row.
   - Deduction: On mobile viewports (<375px), `320px` column + `32px` padding exceeds viewport width, causing double scrollbars (page overflow + board horizontal scroll). `100vh` ignores browser address bar height changes, clipping card footers on mobile screens.

4. **Dashboard Layout Breakpoint Gap Logic**:
   - Observation: `TodayPage` uses `2xl:grid-cols-[1.35fr_.65fr]`.
   - Deduction: Medium-to-large desktop screens (e.g. 1280px - 1535px, 1366x768 laptops, 1440p displays) are treated as mobile single-column layouts because `2xl:` is required to activate side-by-side columns. `lg:` or `xl:` should be used instead.

5. **Touch Target Dimension Logic**:
   - Observation: `.primary-button` uses `min-h: 42px`, `Input`/`Select` use `py-2.5 text-sm` (~40px), and secondary link buttons use raw text with no vertical padding (~16px - ~28px).
   - Deduction: Touch targets below the minimum recommended WCAG 2.2 / iOS / Android touch standard (44px/48px) cause mis-taps and degraded touch ergonomics.

---

## 3. Caveats

- **Runtime Browser Rendering**: Analysis was conducted via static code inspection. Actual browser layout behavior (e.g. WebKit vs Blink rendering engine quirks) should be verified in active mobile emulation (iOS Safari / Chrome Android).
- **Demo Data / Dynamic Content**: Text truncation or card wrapping for long customer/project titles was evaluated against standard string lengths in code; extremely long strings may require further `truncate` or `line-clamp` checks.

---

## 4. Conclusion

The PULSO CRM codebase features clean Tailwind v4 styling, modern CSS variable usage (`var(--paper)`, `var(--signal)`), and strong accessibility semantics in analytical views (like `relatorios`). However, mobile UI/UX exhibits **3 Critical Blockers** and **4 Medium Ergonomic Deficiencies**:

### Critical Blockers
1. **Broken Mobile Hamburger Menu**: Topbar `<button lg:hidden><Menu /></button>` has no `onClick` handler or drawer attached, making 80% of CRM routes unreachable on mobile devices (<1024px).
2. **iOS Safari Focus Auto-Zoom**: Input font sizes are set to `text-sm` (14px) across `@pulso/ui` and forms, causing forced viewport zoom on iPhone touch input.
3. **Kanban Mobile Viewport Clipping**: Fixed `320px` column widths and `100vh` container height cause horizontal scrollbugs and vertical clipping on mobile viewports (<375px).

### Medium Ergonomic Deficiencies
1. **Sub-44px Touch Targets**: Shared buttons (~40px-42px), input controls (~40px), and stage dropdowns (~28px) fall below the 44px/48px WCAG/iOS touch guidelines.
2. **Dashboard Breakpoint Gap**: `TodayPage` uses `2xl:grid-cols-[1.35fr_.65fr]`, keeping 1366px-1440px desktop viewports in a single-column layout.
3. **Touch Chart Hover Tooltips**: Cash flow chart (`financeiro/visao`) uses `group-hover` tooltips with `pointer-events-none`, rendering values difficult to inspect on touch screens.
4. **Mobile Unread Banner Layout**: Today dashboard unread notification banner uses rigid `flex-row`, causing text and action buttons to squeeze on screens <390px.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Mobile Navigation Defect**:
   - File: `apps/web/src/components/topbar.tsx:26` & `apps/web/src/components/sidebar.tsx:24`.
   - Inspect `topbar.tsx` line 26: observe `<button className="... lg:hidden"><Menu className="size-4" /></button>` lacking an `onClick` prop or state handler.
   - Run viewport emulation (<1024px): click hamburger menu icon; observe no menu drawer opens.

2. **Verify Input Font Size & Touch Height**:
   - File: `packages/ui/src/index.tsx:42-47` & `apps/web/src/app/(auth)/login/page.tsx:42`.
   - Observe `text-sm` (14px) and `py-2.5` (~40px total height).
   - In Mobile Safari emulator or device, tap input field; observe automatic page zoom.

3. **Verify Kanban Mobile Overflow & Height**:
   - File: `apps/web/src/app/(crm)/app/comercial/oportunidades/page.tsx:28, 55`.
   - Observe `h-[calc(100vh-6rem)]` and `w-[320px] shrink-0`.
   - Set viewport width to 360px: observe total board width exceeds viewport width, forcing horizontal scrolling for 1 column.

4. **Verify Dashboard Breakpoints**:
   - File: `apps/web/src/app/(crm)/app/hoje/page.tsx:74`.
   - Observe `2xl:grid-cols-[1.35fr_.65fr]`. Set browser width to 1366px (standard laptop); observe single-column layout instead of 2-column layout.
