# Nothing Design System — Source of Truth

This document is the absolute source of truth for the project's UI. The system is rooted in the Nothing Design philosophy: Swiss typography, industrial restraint, monochromatic emphasis, mechanical motion. The dark theme reads as an instrument panel in a dark room; the light theme reads as warm printed paper. Every component, token, and spacing decision must adhere strictly to these guidelines.

AI assistants must reach for the existing primitives in `src/components/ui/*` and the semantic `.ui-*` utilities in `src/app/globals.css` before writing new class chains. Tokens are defined once and consumed everywhere — never hard-code colors.

---

## 1. Color Palette

### Token Indirection
Two layers feed Tailwind v4 (`@theme`):

1. `--theme-*` per-mode variables, swapped by toggling `.dark` / `.light` on `<html>` ([globals.css:104-156](src/app/globals.css:104)).
2. `--color-*` indirection that maps the active theme into Tailwind utilities ([globals.css:4-43](src/app/globals.css:4)).

Authoring rule: reference Tailwind classes that resolve to `--color-*` (e.g. `bg-surface`, `text-text-display`, `border-border-visible`). Never inline raw hex or use palette-coded utilities like `bg-zinc-*` / `text-white` — those break light-mode parity.

### Dark Mode Palette (`:root, .dark`)
Color is reserved for data status, events, and highlights — never for decoration.

**Backgrounds & Surfaces**
- **Black (OLED)**: `#000000` — `bg-root`, raised side rails (rare).
- **Background**: `#0a0a0a` — main app canvas (`bg-background`).
- **Surface**: `#111111` — default cards and modals (`bg-surface`).
- **Surface Raised**: `#1A1A1A` — elevated components, headers, active states (`bg-surface-raised`).
- **Surface Variant**: `#353434`.
- **Surface Bright**: `#3A3939`.

**Borders**
- **Border**: `#222222` — subtle dividers, structural.
- **Border Visible**: `#333333` — intentional outlines, component borders.
- **Outline Variant**: `#444748` — focus / hover edges.

**Text**
- **Text Display**: `#FFFFFF` — headlines, hero metrics.
- **Text Primary**: `#E8E8E8` — body, primary values.
- **Text Secondary**: `#999999` — labels, captions, metadata.
- **Text Disabled**: `#666666` — inactive, empty states.

### Light Mode Palette (`.light`)
A warm, beige paper system. Same semantic slots, lower contrast, no pure white.

**Backgrounds & Surfaces**
- **Bg Root / Background**: `#F4F1EA`.
- **Surface**: `#EBE7DD` — default cards.
- **Surface Raised**: `#E2DDD1` — elevated components, header rails, active nav.
- **Surface Variant**: `#D8D1C4`.
- **Surface Bright**: `#CDC3B4`.

**Borders**
- **Border**: `#D8D1C4`.
- **Border Visible**: `#C7BEB0`.
- **Outline Variant**: `#A99F91`.

**Text**
- **Text Display**: `#111111`.
- **Text Primary**: `#242424`.
- **Text Secondary**: `#6F6A60`.
- **Text Disabled**: `#9A9286`.

### Cross-Mode Accents & Status
Status colors are applied to the value, not the background or label.
- **Accent**: `#D71921` — signal light, active states, urgent moments, destructive actions.
- **Accent Subtle**: `rgba(215, 25, 33, 0.15)` — alert glows, rejection note backgrounds.
- **Interactive**: `#5B9BF6` — links, selected elements, hover highlights, "Ideation" pipeline stage.
- **Success**: `#4A9E5C` — confirmed, completed, "Published".
- **Warning**: `#D4A843` — caution, pending, degraded, "Filming/Editing" active.
- **Error**: `#FFB4AB` — critical failures (preserved across modes for legibility).

### Shared Semantic Tokens
Mode-aware vars used by interactive surfaces and chrome:
- `text-inverse` — foreground over a `text-display` fill (used by primary buttons and inverted badges).
- `input-surface` — input fill (transparent in both modes by default).
- `hover-surface` — translucent overlay for row/menu hover (`rgba(255,255,255,0.05)` dark / `rgba(17,17,17,0.06)` light).
- `danger-hover` — destructive hover stroke (`#F87171` dark / `#B91C1C` light).
- `disabled-surface` — disabled overlay.
- `selection-bg` / `selection-text` — text selection.
- `scrollbar-track` / `scrollbar-thumb` / `scrollbar-thumb-hover` — mechanical 6px scrollbar.

---

## 2. Typography

Maximum 3 font families per screen. Precision over personality.

**Families**
- **Display**: `Doto` (dot-matrix variable font for hero metrics and major numbers).
- **Heading / Body**: `Space Grotesk` (Light 300, Regular 400, Medium 500, Bold 700).
- **Labels / Data**: `Space Mono` (Regular 400, Bold 700).

**Type Scale**

| Role | Size | Line Height | Tracking | Font & Weight |
| --- | --- | --- | --- | --- |
| **Display XL** | 72px | 1.0 | -0.03em | Doto |
| **Display LG** | 48px | 1.05 | -0.02em | Doto |
| **Display MD** | 36px | 1.1 | -0.02em | Space Grotesk 500 |
| **Heading** | 24px | 1.2 | -0.01em | Space Grotesk 500 |
| **Subheading** | 18px | 1.3 | 0 | Space Grotesk 400 |
| **Body** | 16px | 1.5 | 0 | Space Grotesk 400 |
| **Body SM** | 14px | 1.5 | +0.01em | Space Grotesk 400 |
| **Caption** | 12px | 1.4 | +0.04em | Space Mono 400 |
| **Label** | 11px | 1.2 | +0.08em | Space Mono 700 (ALL CAPS) |

**Helper Classes** ([globals.css:198-267](src/app/globals.css:198))

These are the canonical way to apply the scale. Prefer them over re-deriving raw `font-*` chains:

`.text-style-display-xl`, `.text-style-display-lg`, `.text-style-display-md`, `.text-style-heading`, `.text-style-subheading`, `.text-style-body`, `.text-style-body-sm`, `.text-style-caption`, `.text-style-label`.

---

## 3. Spacing, Shape & Containers

### Spacing Scale (8px base) — [globals.css:46-54](src/app/globals.css:46)
- **2xs** (2px) — optical adjustments, tight segmented gaps.
- **xs** (4px) — icon-to-label gaps, tightest padding.
- **sm** (8px) — component internal spacing.
- **md** (16px) — standard padding, gaps between form items.
- **lg** (24px) — group separation, kanban column gaps, primary page margins (`p-lg`).
- **xl** (32px) — section margins, modal padding.
- **2xl** (48px) — major section breaks.
- **3xl** (64px) — page-level vertical rhythm.
- **4xl** (96px) — hero breathing room.

### Border Radius — [globals.css:73-77](src/app/globals.css:73)
Sharp edge is the default for everything sitting on the canvas. Components opt into radius only for specific control affordances.
- **Default** (4px) — internal UI controls (rare).
- **lg** (8px) — interior chips and small controls (rare).
- **xl** (12px) — soft callouts (rarely used).
- **Full** (9999px) — avatars, indicator dots, pill-shaped login button.

Cards, kanban columns, modals, top bar, sidebar, tables: stay at **0px**.

### Container Widths — [globals.css:56-71](src/app/globals.css:56)
Tailwind v4 `--container-*` values are restored explicitly so `max-w-*` resolves to rem widths (e.g. `max-w-3xl = 48rem`) and is not shadowed by the `--spacing-*` scale. Use the standard Tailwind classes — they map to the correct widths.

---

## 4. Component Structures

### A. Kanban Pipeline

**Sidebar** — [Sidebar.tsx](src/components/layout/Sidebar.tsx)
- Fixed `w-64` (256px), `bg-background border-r border-border`, `z-50`.
- Logo: `font-[family-name:var(--font-label)] text-[44px] font-black text-text-display tracking-tight`, renders `projmgmt`. Sits inside `mb-xl px-3` block.
- Nav items: `text-style-label tracking-widest`, 18px Material Symbol leading icon (`icon-fill` when active), `px-3 py-2`, `gap-4` icon-to-label.
- Active state: `text-text-display border border-border-visible bg-surface-raised`. Inactive: `text-text-disabled hover:text-text-display hover:bg-surface-raised`, `border border-transparent`.
- Role-based filtering: members see a reduced nav (see §8).

**Top Bar** — [TopBar.tsx](src/components/layout/TopBar.tsx)
- `h-16 px-6 flex items-center justify-between`, `bg-background border-b border-border`, `z-40`.
- Search: underlined `border-b border-border-visible px-2 py-1`, leading 16px `search` Material Symbol, `font-mono text-xs` input. Updates `?q=` via router.
- Primary action **NEW PROJECT**: sharp (`bg-text-display text-text-inverse text-[10px] font-mono tracking-widest uppercase px-6 py-2 hover:opacity-80`). The pill shape from earlier specs is reserved for the auth login button — TopBar is sharp.
- Avatar button: `w-8 h-8 bg-surface border border-border` (sharp). Renders `session.user.avatarUrl` via `next/image` `unoptimized`, falls back to `person` Material Symbol.

**User Dropdown** — [TopBar.tsx:115-159](src/components/layout/TopBar.tsx:115)
- Wrapper: `.ui-user-dropdown` + `border border-border-visible w-56 text-xs font-mono`.
- Heading row: `.ui-user-dropdown-heading` with `font-bold tracking-widest`.
- Action rows use `.ui-user-dropdown-row` (hover → `text-text-display` + `hover-surface`):
  - `Settings` (lucide) + `SETTINGS` linking to `/settings`.
  - Theme toggle: `Sun` (light active) / `Moon` (dark active) lucide icon + bracket toggle on the right showing the **target** mode (`[LIGHT]` while in dark, `[DARK]` while in light).
  - `LogOut` + `LOG OUT` calling `signOut({ callbackUrl: "/login" })`.
- Closes on outside click via mousedown listener.

**Pipeline Columns** — [KanbanColumn.tsx](src/components/kanban/KanbanColumn.tsx)
- `w-[320px]`. Header `border-b border-border-visible`. Title in `uppercase text-text-primary`, item count in brackets (e.g. `[ 2 ]`) in `text-text-secondary`.
- 6px mechanical scrollbar inherits from `globals.css` (no per-column override).

**Pipeline Cards** — [KanbanCard.tsx](src/components/kanban/KanbanCard.tsx)
- Sharp `bg-surface border border-border p-md flex flex-col gap-sm`. Hover lifts to `border-border-visible`. `cursor-pointer` (whole card). Drag-and-drop via `@dnd-kit/sortable`; while dragging, opacity drops to 30%.
- Light-mode rule: standard cards and Filming split cards must read on the same surface token; reserve `surface-raised` for true elevation, not status styling. The `.ui-filming-card-surface` helper handles the inversion automatically (raised in dark, flat in light).
- Title: `text-style-subheading text-text-primary font-[family-name:var(--font-heading)]`. Card menu (`CardMenu`) sits to the right.
- Tags: `Tag` component (`text-[9px] uppercase border border-border-visible px-2 py-[2px]`).
- Rejection feedback (Editing + `reviewFeedback`): card border becomes `border-accent/30`; injects `mt-3 p-2 bg-accent-subtle border-l-2 border-accent` block with `REVISION NOTES` label and `line-clamp-3` body.
- Deadline strips (Scripting / Filming / Editing due dates): compact `border border-border-visible bg-input-surface px-2 py-1.5`, label on the left, date on the right. Month names must use the active app locale (`APR 29` in English, `29 THG 4` in Vietnamese).
- Footer: `mt-sm pt-sm border-t border-border` divider with 6-char project ID `#XXXXXX` in `text-style-caption text-text-secondary`, plus the assignee stack on the right.

**Assignee Stack** — [KanbanCard.tsx:46-205](src/components/kanban/KanbanCard.tsx:46)
- Merges six role fields into a deduped list (skipping `UNASSIGNED`): `assignedEditor`, `assignedCameraman`, `assignedTalent`, `aRollAssignee`, `bRollAssignee`, `editingAssignee`.
- Each chip: `w-7 h-7 border border-border-visible bg-surface-raised text-text-primary text-xs font-mono flex items-center justify-center overflow-hidden`. Sharp corners.
- Stacking: chips after the first use `-ml-2` for overlap; `z-index` decreases left → right (first chip on top).
- Renders `next/image` avatar (`w-7 h-7 object-cover`, `unoptimized`) when `avatarUrl` present, otherwise 2-letter `getInitials()` text.
- `title={assignee.name}` for hover identification.

**Filming Split Cards** — [FilmingSplitCard.tsx](src/components/kanban/FilmingSplitCard.tsx)
- Reuses `.ui-filming-card-surface` and the same assignee-stack pattern.

### B. Modals

**Overlay & Shell**
- Backdrop: `.ui-modal-backdrop` (`color-mix(in srgb, var(--color-background) 92%, transparent)`) wrapped in `fixed inset-0 z-[100]`. Dark mode reads as `bg-black/90 backdrop-blur-md`-equivalent; light mode keeps the warm beige.
- Centered shell: `relative w-full max-w-5xl ui-panel flex flex-col` (or smaller variants `max-w-2xl` etc.). Sharp corners, no drop shadow.
- Side sheet variant ([TeamMemberModal.tsx:79-82](src/components/modals/TeamMemberModal.tsx:79)): `right-0 h-screen w-full sm:w-[450px] ui-modal-shell border-l`, slides in from the right.

**Header**
- `flex justify-between items-start p-6 border-b border-border-visible shrink-0`.
- Status dot (semantic color), Mono ID, uppercase title on the left. Right side: Doto percentage metric or close `X`.

**Workspace**
- Inputs use the underlined `Input` component or `.ui-input` / `.ui-select` / `.ui-textarea` for bordered controls.
- Buttons use bracket notation for outline actions (`[ APPROVE ]`, `[ UPLOAD AVATAR ]`) or `Button` with `variant="primary"` / `.ui-button-primary` for high-contrast fills.
- Asset Management RAW row: single attached strip (`bg-input-surface border border-border-visible`) with left RAW label, center editable/view state, right utility actions. View state shows OS badge (`[  ]` / `[ ⊞ ]`) and generated NAS path. Edit state is inline text with Enter-to-save.
- Asset Management Nextcloud row: review link input stays underlined and compact. When no link exists, the scanner appears as a terminal command button labeled `[ SCAN FOR DRAFT {version} ]`; while running it becomes `[ SCANNING... ]`. Once a link is detected, hide the scanner and show only the stored link/open affordance until rejection clears the link.
- Sponsored create mode adds a required Sponsorship Deal select above the briefing fields. The selected deal preview is a sharp bordered context block with brand, status, source budget, preferred-currency equivalent when applicable, due date, contact, and notes. Keep this block informational and dense; do not turn it into a decorative marketing card.
- Sponsored project edit mode shows Sponsorship Context in the left modal column and the linked Client / Brand in the metadata sidebar. Preserve uppercase labels, mono metadata, and semantic status/value colors.
- Sponsorship create/edit modal uses a source currency select directly beside Budget. When the selected source currency differs from the user's preferred currency, show a compact bordered preferred-currency preview below the control row.
- Interactive metadata sidebar: platform chips and pipeline-stage list support click-to-update with hover transitions and disabled pending states. Terminal typography preserved.

**Destructive Actions**
- Always map to `.ui-button-danger` (`text-accent border-accent/40 hover:bg-accent-subtle`). Never raw `red-500` palette colors.

### C. Authentication (Login)
- **Container**: `max-w-[24rem] px-lg` centered in viewport.
- **Hero**: `text-style-display-xl` with `mix-blend-difference`. Structured separator: hairlines + `SYS_AUTH` label in `.text-style-label`.
- **Form Inputs**: minimalist. No bounding boxes. `border-b border-border-visible bg-transparent`. Text `text-text-display` in `text-style-caption`. Label sits above and shifts to `text-text-display` on focus via `group-focus-within`.
- **Buttons**: pill (`rounded-full`), `min-w-[160px]`, `bg-text-display text-text-inverse`. The login screen is the **only** place pill primary buttons are used.

### C.1 First-Run Setup
- `/setup` appears only while `prisma.user.count() === 0`; `/` and `/login` redirect there in an uninitialized database.
- Shell: centered `max-w-[28rem]`, sharp `border border-border-visible bg-surface p-2xl`, and the shared `Wordmark` header.
- Inputs mirror auth: transparent underlines, `.text-style-label` labels, `.text-style-caption` input text, `focus:border-text-display`.
- Submit action is sharp high-contrast (`bg-text-display text-text-inverse`) and labeled with terminal command copy. Error copy must use `text-error` or another semantic token, never raw palette classes.

### D. Dashboards, Tables & List Pages

**Page Container**
- Unified to `<div className="h-full w-full overflow-auto p-lg">` with a `mb-6` header wrapper across all tabular screens.

**Data Tables**
Prefer the semantic class set ([globals.css:426-454](src/app/globals.css:426)) over re-deriving Tailwind chains:
- `.ui-table-head` — header row (10px Mono uppercase, `border-b border-border-visible`).
- `.ui-table-row` — body rows (`border-b border-border`, hover → `hover-surface`).
- `.ui-table-cell` — primary cell (`text-text-primary`, 14px Caption font).
- `.ui-table-cell-muted` — secondary cell (`text-text-secondary`, 12px).

**Status Cells**: inline link `font-label text-text-secondary` with leading `w-1.5 h-1.5 rounded-full` token-colored dot (`StatusDot`).

**Tab Filters**: huge uppercase typography `text-2xl font-bold tracking-wider`. Inactive `text-text-disabled` with `hover:text-text-secondary`; active `text-text-display`. Header actions (e.g. `NEW SPONSORSHIP`) align right in the bottom-bordered tab row.

**Sponsorship Deal Rows**: table and mobile cards include a compact linked project count. Render the count as plain mono data, not a badge; the row is still primarily about brand, status, contact, due date, and deal value. Deal value renders in the current user's preferred currency, with the source amount underneath when it differs. The header metadata includes preferred currency, last rate refresh, a discreet provider attribution link, and any missing-rate warning in `text-warning`.

**Archive Metric Cells**: Views/Likes/Comments render grand totals from platform columns (`youtube* + meta* + tiktok*`) and display with locale separators (`toLocaleString()`).

**Analytics Performer Rows**: platform chips (`YT`, `IG`, `TT`) and per-platform metric strings render only for selected/synced platforms. Format badges (`Short Form`, `Long Form`) sit inline with the title using tiny bordered uppercase tokens.

### E. Settings
- **Layout**: `max-w-[48rem]` centered. Categories separated by `border-t border-border-visible pt-8`.
- **Inputs**: transparent under-bordered `border-0 border-b border-border-visible`.
- **Avatar Upload Form** ([AvatarUploadForm.tsx](src/app/settings/AvatarUploadForm.tsx)): preview chip is `w-20 h-20 border border-border-visible bg-surface` (sharp). Action button uses bracket notation `[ UPLOAD AVATAR ]`. Files land in `public/avatars/*`, are served through `/api/avatars/[filename]`, and Docker persists them through the `projmgmt-avatars` volume.
- **Currency Preference Form** ([CurrencyPreferenceForm.tsx](src/app/settings/CurrencyPreferenceForm.tsx)): lives under Preferences beside Language. Use `.ui-select`, mono uppercase labels, and save-on-select behavior with toast feedback.
- **Save Action**: bottom-anchored, right-aligned, sharp `bg-text-display text-text-inverse` (or `Button variant="primary"`).

---

## 5. Animation & Motion

- **Durations**: 150ms micro-interactions, 200ms standard transitions, 300ms section transitions.
- **Easing**: `cubic-bezier(0.25, 0.1, 0.25, 1)` (subtle ease-out, no bounce). Exposed as `--ease-mechanical`.
- **Toast slide-in**: `slideIn 200ms ease-out` keyframe ([globals.css:483-492](src/app/globals.css:483)) — 16px translate-X, opacity 0 → 1.
- **Style**: mechanical and precise. Hover changes brightness and border color; never scale, never drop shadow. Transparency and opacity are preferred over sliding movement.

---

## 6. Semantic UI Utilities

Reference for `.ui-*` classes ([globals.css:269-471](src/app/globals.css:269)). Reach for these before writing new chains.

| Class | Purpose |
| --- | --- |
| `.ui-panel` / `.ui-panel-raised` | Card / elevated card shell (surface + visible border) |
| `.ui-modal-backdrop` | Mode-aware overlay fill |
| `.ui-modal-shell` | Side-sheet / panel modal container |
| `.ui-button-primary` | High-contrast fill button (text-display fill) |
| `.ui-button-outline` | Bordered outline button |
| `.ui-button-ghost` | Unbordered text-only button |
| `.ui-button-danger` | Destructive action (accent text, accent/45 border, accent-subtle hover) |
| `.ui-input` / `.ui-select` / `.ui-textarea` | Bordered form controls (alternative to `Input`'s underline style) |
| `.ui-table-head` | Table header row |
| `.ui-table-row` | Table body row with hover-surface |
| `.ui-table-cell` / `.ui-table-cell-muted` | Cell hierarchy |
| `.ui-tag-muted` | Inline 9px uppercase tag |
| `.ui-bar-track` / `.ui-bar-fill` | Progress segments |
| `.ui-user-dropdown` | Header user-menu wrapper |
| `.ui-user-dropdown-heading` | Username heading row |
| `.ui-user-dropdown-row` | Action row (hover swaps to text-display + hover-surface) |
| `.ui-user-dropdown-toggle` | Right-side bracket label inside a row |
| `.ui-page-kicker` | 10px Mono uppercase pre-title kicker |
| `.ui-page-title` | Page H1 (uppercase, tracked) |
| `.ui-page-meta` | Caption-sized metadata |
| `.ui-divider` | `border-color: var(--color-border-visible)` helper |
| `.ui-filming-card-surface` | Mode-aware filming card background (raised dark, flat light) |

---

## 7. Theme System

- **Provider**: `next-themes` `ThemeProvider` in [providers.tsx](src/app/providers.tsx) with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`.
- **Mechanism**: toggling sets `<html>` to `.dark` or `.light`. The CSS-variable indirection swaps the entire palette without rerendering React state.
- **UX Toggle**: in the header user dropdown (see §4.A). Row uses `Sun` / `Moon` icons; the right-hand bracket label shows the **target** mode (`[LIGHT]` while currently dark, `[DARK]` while currently light).
- **Authoring Rule**: never hard-code colors. Always use semantic tokens (`bg-surface`, `text-text-display`, `border-border-visible`, etc.) so components track mode automatically. Flag any class chain that breaks light-mode parity (e.g. raw `bg-zinc-*`, `text-white`, `border-white/N`) as a bug.

---

## 8. Role-Based Access (RBAC)

- **Roles**: `USER_ROLES = ["ADMIN", "MANAGER", "MEMBER"]` ([roles.ts](src/lib/roles.ts)).
- **Middleware** ([middleware.ts](src/middleware.ts)): blocks `MEMBER` from `/analytics`, `/sponsorships`, `/team`.
- **Sidebar Gating** ([Sidebar.tsx:9-17](src/components/layout/Sidebar.tsx:9)): `getVisibleNavItems()` filters those routes for `MEMBER` so the side nav matches what middleware allows.
- **Session**: JWT carries `role` from `normalizeRole()` ([auth.ts](src/lib/auth.ts)). Read via `useSession().data?.user?.role` or server-side `getServerSession`.
- **Admin-Only UI**: `TeamMemberModal` exposes a role selector backed by `USER_ROLES` for ADMINs to assign roles during create/edit.
- **Authoring Rule**: gate UI on `session?.user?.role`, not feature flags. New protected pages must be added to **both** `memberHiddenRoutes` and the middleware matcher together; missing one creates a leak.

---

## 9. Component Library Reference

Single-line summaries for `src/components/ui/*`. Reach for these before rebuilding.

- **Button** — variants `primary | secondary | ghost | danger`, sizes `sm | md | lg`, `pill` flag. Uses `text-style-label` and theme tokens. ([Button.tsx](src/components/ui/Button.tsx))
- **Input** — label above with `group-focus-within:text-text-display`; underline-only `border-b border-border-visible`, `bg-transparent`, `text-style-caption`. ([Input.tsx](src/components/ui/Input.tsx))
- **Checkbox** — sharp `w-3.5 h-3.5` square, `border-border-visible`. ([Checkbox.tsx](src/components/ui/Checkbox.tsx))
- **ProgressBar** — flex segments with `gap-[2px]`, default `h-[4px]`. Uses `.ui-bar-track` / `.ui-bar-fill`. ([ProgressBar.tsx](src/components/ui/ProgressBar.tsx))
- **StatusDot** — `w-1.5 h-1.5 rounded-full`, status-color token. ([StatusDot.tsx](src/components/ui/StatusDot.tsx))
- **Tag** — `text-[9px] uppercase`, bordered, optional `color` / `borderColor` / `bgColor` props. Disabled state = strike-through + 40% opacity. ([Tag.tsx](src/components/ui/Tag.tsx))
- **Toast** — bottom-right `fixed bottom-xl right-xl z-[9999]`, types `error | success | warning` → `SYS_ERROR | SYS_OK | SYS_WARN` labels with matching accent border, leading Material Symbol, 4-second auto-dismiss, `slideIn 200ms ease-out` entry. Use via `useToast().showToast(message, type)`. ([Toast.tsx](src/components/ui/Toast.tsx))
- **CopyBlock** — copy-to-clipboard wrapper. ([CopyBlock.tsx](src/components/ui/CopyBlock.tsx))
