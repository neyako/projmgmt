---
name: projmgmt
description: Self-hosted content production management in a sharp terminal dashboard.
colors:
  root-black: "#000000"
  dark-background: "#0a0a0a"
  dark-surface: "#111111"
  dark-surface-raised: "#1a1a1a"
  dark-surface-variant: "#353434"
  dark-surface-bright: "#3a3939"
  dark-border: "#222222"
  dark-border-visible: "#333333"
  dark-outline: "#444748"
  dark-text-display: "#ffffff"
  dark-text-primary: "#e8e8e8"
  dark-text-secondary: "#999999"
  dark-text-disabled: "#666666"
  paper-background: "#f4f1ea"
  paper-surface: "#ebe7dd"
  paper-surface-raised: "#e2ddd1"
  paper-surface-variant: "#d8d1c4"
  paper-surface-bright: "#cdc3b4"
  paper-border: "#d8d1c4"
  paper-border-visible: "#c7beb0"
  paper-outline: "#a99f91"
  paper-text-display: "#111111"
  paper-text-primary: "#242424"
  paper-text-secondary: "#6f6a60"
  paper-text-disabled: "#9a9286"
  signal-red: "#d71921"
  signal-red-subtle: "#d7192126"
  interactive-blue: "#5b9bf6"
  success-green: "#4a9e5c"
  warning-amber: "#d4a843"
  error-pink: "#ffb4ab"
typography:
  display:
    fontFamily: "Doto, JetBrains Mono, monospace"
    fontSize: "72px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Space Grotesk, DM Sans, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Space Grotesk, DM Sans, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Space Grotesk, DM Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  caption:
    fontFamily: "JetBrains Mono, SF Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.04em"
  label:
    fontFamily: "JetBrains Mono, SF Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  none: "0px"
  default: "4px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  2xs: "2px"
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
  4xl: "96px"
components:
  button-primary:
    backgroundColor: "{colors.dark-text-display}"
    textColor: "{colors.root-black}"
    rounded: "{rounded.none}"
    padding: "8px 24px"
  button-outline:
    backgroundColor: "{colors.dark-background}"
    textColor: "{colors.dark-text-secondary}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  button-danger:
    backgroundColor: "{colors.dark-background}"
    textColor: "{colors.signal-red}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  panel:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-text-primary}"
    rounded: "{rounded.none}"
    padding: "24px"
  input:
    backgroundColor: "{colors.dark-background}"
    textColor: "{colors.dark-text-display}"
    rounded: "{rounded.none}"
    padding: "8px"
  picker:
    backgroundColor: "{colors.dark-background}"
    textColor: "{colors.dark-text-display}"
    rounded: "{rounded.none}"
    padding: "4px 24px 8px 0"
  tag:
    backgroundColor: "{colors.dark-background}"
    textColor: "{colors.dark-text-secondary}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
---

# Design System: projmgmt

## 1. Overview

**Creative North Star: "The Terminal Control Room"**

projmgmt is a self-hosted production console, not a generic SaaS surface. The visual system should feel like a terminal instrument panel used by a small video team while deadlines, shotlists, sponsor deals, drafts, analytics, and storage paths are moving at once. It is sharp, compact, high-contrast, and deliberate.

The system is product-first: design serves the workflow. Familiar structures are allowed when they make the tool faster, but every visible detail must keep the terminal identity. Dark mode reads as a control room. Light mode reads as warm printed paper with the same semantic hierarchy, never a reset into stock web-app styling.

It explicitly rejects the PRODUCT.md anti-references: corporate cards, soft shadows, decorative gradients, glassmorphism, bouncy motion, rounded default UI, raw Tailwind palette colors, smooth easing, spring physics, scale hovers, animated layout properties, marketing layouts, and decorative page choreography.

**Key Characteristics:**

- Dense operational surfaces with clear hierarchy and compact labels.
- Sharp rectangular panels, visible borders, and semantic color tokens.
- Mono-heavy labels, IDs, metrics, tags, and table data.
- Mechanical stepped motion used only for state, load, or terminal presence.
- Dark and light modes powered by the same semantic slots.

## 2. Colors

The palette is restrained and semantic: near-black control-room neutrals, warm-paper light mode neutrals, one red signal accent, and status colors reserved for meaning.

### Primary

- **Signal Red** (`signal-red`): urgent actions, destructive controls, rejection notes, and alert emphasis. It is never decorative.
- **Signal Red Subtle** (`signal-red-subtle`): low-intensity alert fills, revision note backgrounds, and destructive-hover context.

### Secondary

- **Interactive Blue** (`interactive-blue`): links, selected interactive affordances, and the Ideation stage signal.
- **Success Green** (`success-green`): completed work, published state, and positive sync feedback.
- **Warning Amber** (`warning-amber`): pending, active production caution, filming, editing, and degraded-but-not-failed states.
- **Error Pink** (`error-pink`): critical failures where legibility must survive both themes.

### Neutral

- **Root Black** (`root-black`): OLED root rails and inverse foregrounds.
- **Dark Background** (`dark-background`): default app canvas.
- **Dark Surface** (`dark-surface`): cards, modals, tables, dropdowns, and content panels.
- **Dark Surface Raised** (`dark-surface-raised`): elevated chrome, active states, skeleton rails, and dark-mode filming surfaces.
- **Dark Border Visible** (`dark-border-visible`): structural outlines and component boundaries.
- **Dark Text Display** (`dark-text-display`): headings, primary values, active nav, and high-contrast fills.
- **Dark Text Primary / Secondary / Disabled** (`dark-text-primary`, `dark-text-secondary`, `dark-text-disabled`): body text, labels, metadata, and inactive states.
- **Paper Background / Surface / Raised** (`paper-background`, `paper-surface`, `paper-surface-raised`): light-mode equivalents that preserve hierarchy as warm printed paper.
- **Paper Border Visible** (`paper-border-visible`): light-mode outlines and table structure.
- **Paper Text Display / Primary / Secondary / Disabled** (`paper-text-display`, `paper-text-primary`, `paper-text-secondary`, `paper-text-disabled`): light-mode text hierarchy.

### Named Rules

**The Token Gate Rule.** Components must consume semantic Tailwind tokens from `src/app/globals.css`, not hardcoded hex values or raw Tailwind palette classes.

**The Meaning Only Rule.** Accent and status colors are applied to values, controls, and state indicators. They are forbidden as decoration.

**The Light Parity Rule.** Every component must work through the same semantic slots in dark and light mode. If a class works only because the app is dark, it is wrong.

## 3. Typography

**Display Font:** Doto, with JetBrains Mono fallback.  
**Body Font:** Space Grotesk, with DM Sans and system fallback.  
**Label/Mono Font:** JetBrains Mono, with SF Mono and ui-monospace fallback.

**Character:** Dot-matrix display type is reserved for major values and terminal presence. Space Grotesk carries readable product UI. JetBrains Mono makes labels, IDs, data, and commands feel precise.

### Hierarchy

- **Display** (400, 72px, 1.0): login hero, major metrics, and rare instrument-panel moments.
- **Headline** (500, 36px, 1.1): page-level or modal-level emphasis when the surface needs a large readout.
- **Title** (500, 24px, 1.2): page titles, modal titles, and major panel names.
- **Subheading** (400, 18px, 1.3): card titles, secondary headings, and dense section names.
- **Body** (400, 16px, 1.5): readable prose and form-adjacent explanation. Keep prose to 65-75ch.
- **Caption** (400, 12px, 1.4, 0.04em): table data, compact metadata, input text, and machine-like readouts.
- **Label** (700, 11px, 0.08em, uppercase): navigation, buttons, table heads, form labels, and bracketed commands.

### Named Rules

**The Command Voice Rule.** Functional copy is short, uppercase, and specific. Bracketed commands such as `[ APPROVE ]` and `[ SCAN FOR DRAFT 2 ]` are part of the system language.

**The No Display Labels Rule.** Doto never appears in buttons, form labels, table data, or navigation. Data-dense UI uses mono and Space Grotesk.

## 4. Elevation

projmgmt does not use shadows as its depth system. Elevation is expressed through tonal layers, border visibility, and state inversion. A raised surface is a different semantic background plus a visible border, not a soft floating object.

### Named Rules

**The Flat Instrument Rule.** Panels, tables, modals, dropdowns, cards, and columns stay sharp and flat. Use `ui-panel`, `ui-panel-raised`, borders, and tokenized surfaces instead of shadows.

**The Border Is Structure Rule.** Borders describe containment, table rhythm, and active state. Do not use side-stripe borders as decorative accents.

**The Inversion Rule.** Hover and active states invert or tighten contrast instantly. They do not lift, scale, blur, or bounce.

## 5. Components

### Buttons

- **Shape:** sharp rectangle by default (`0px`). `rounded-full` is reserved for avatars, indicator dots, and the login primary button.
- **Primary:** `bg-text-display text-text-inverse border-text-display`, mono uppercase label, typically `8px 24px`.
- **Outline:** transparent or background-colored fill, visible border, `text-text-secondary`, instant hover to `bg-text-display text-text-inverse`.
- **Danger:** `text-accent border-accent/40 hover:bg-accent-subtle`. Destructive actions must never use raw red palette classes.
- **States:** disabled states reduce opacity and cursor affordance; loading states keep the same geometry.
- **Extraction:** use `Button` for React controls and `buttonStyles()` from `src/components/ui/controlStyles.ts` for shared class composition.

### Chips and Tags

- **Style:** tiny mono uppercase tags, `9px` type, `2px 8px` padding, transparent fill, visible border.
- **State:** selected or status meaning comes from semantic text/border/fill tokens. Disabled tags use lower opacity and line-through.
- **Use:** platform chips, content format badges, metadata tokens, and compact row facts.

### Cards and Containers

- **Corner Style:** square corners (`0px`) for cards, modals, tables, columns, and page panels.
- **Background:** `bg-surface` for standard content, `bg-surface-raised` only for true elevation or active chrome.
- **Border:** `border-border` for quiet structure, `border-border-visible` for intentional containment.
- **Internal Padding:** `p-md` for cards, `p-lg` for page containers and larger panels, `p-xl` or `p-2xl` only for modal or setup breathing room.
- **Do not:** nest cards inside cards or wrap page sections in decorative floating panels.

### Inputs and Fields

- **Style:** underlined `Input` component for compact forms, or `.ui-input`, `.ui-select`, and `.ui-textarea` for bordered controls.
- **Focus:** border moves to `text-display`; no glow, no blur, no shadow.
- **Native UI:** date and select controls include `color-scheme-dark` where browser chrome can leak.
- **Errors:** use `text-error`, `text-accent`, or semantic alert treatments.
- **Extraction:** use `Input` for text/date/number fields and `inputStyles()` for dense modal fields that keep their own label layout.

### Pickers

- **Style:** native `<select>` behind the `Picker` component, with `appearance-none`, semantic field styling, and a shared terminal chevron.
- **Variants:** `underline` for sidebar/modal metadata fields, `panel` for boxed settings and CRM controls.
- **State:** focus uses `border-text-display`; disabled uses opacity and cursor state without changing layout.
- **Extraction:** use `Picker` for labeled selects and `pickerStyles()` plus `PickerChevron` when an existing relative container must remain intact.

### Navigation

- **Sidebar:** fixed `256px` rail on desktop, compact mobile header, mono uppercase nav labels, Material Symbols where the shell already uses them.
- **Active State:** `text-text-display border-border-visible bg-surface-raised`.
- **Inactive State:** muted text, transparent border, instant inverted hover.
- **Role Filtering:** navigation visibility follows session role and middleware. New protected routes must update both.

### Tables and List Pages

- **Container:** `h-full w-full overflow-auto p-lg` with a compact header block.
- **Rows:** `.ui-table-row` with visible bottom dividers and tokenized hover surface.
- **Cells:** `.ui-table-cell` for primary data, `.ui-table-cell-muted` for secondary data.
- **Headers:** `.ui-table-head`, 10px mono uppercase, bottom border visible.
- **Metrics:** Archive and Analytics totals come from platform-specific columns, not legacy rollup fields.

### Modals and Sheets

- **Overlay:** `.ui-modal-backdrop`, mode-aware and dense.
- **Shell:** `.ui-panel` or `.ui-modal-shell`, sharp, bordered, no shadow.
- **Header:** compact ID/status/title cluster with an explicit close control.
- **Workflow:** avoid modal-first thinking for new UI, but preserve existing modal workflows where they carry dense editing, publish, sponsorship, or team state.

### Kanban Pipeline

- **Columns:** fixed-width work lanes, compact headers, bracketed item counts, mechanical scrollbars.
- **Cards:** sharp bordered surfaces with title, tags, due strips, assignee stack, project ID, and status-specific controls.
- **Drag:** `DndContext` remains behind the mounted guard, and `PointerSensor` keeps an activation constraint so card clicks still open modals.
- **Gates:** Filming to Editing, Editing to Review, Review rejection, and Published transition must show the real workflow conditions at the action point.

## 6. Do's and Don'ts

### Do:

- **Do** use semantic Tailwind tokens from `src/app/globals.css` for all colors, borders, text, and surfaces.
- **Do** preserve the terminal aesthetic over generic SaaS polish.
- **Do** keep labels compact, uppercase, mono-heavy, and directly tied to action or data.
- **Do** use existing primitives and utilities: `Button`, `Input`, `Picker`, `Checkbox`, `Tag`, `StatusDot`, `Toast`, `controlStyles`, `.ui-panel`, `.ui-button-*`, `.ui-table-*`, `.ui-tag-muted`, and `.ui-bar-*`.
- **Do** keep page containers for tables and lists at `h-full w-full overflow-auto p-lg`.
- **Do** compute localized dates and sponsorship currency displays through the existing helper APIs.
- **Do** keep motion mechanical, stepped, short, and state-driven.
- **Do** verify UI changes in the browser when feasible, especially Kanban interactions, modal state sync, and responsive table/list layouts.

### Don't:

- **Don't** use corporate cards, soft shadows, decorative gradients, glassmorphism, bouncy motion, or rounded default UI.
- **Don't** use raw Tailwind palette colors such as `red-500`, `green-400`, `emerald-500`, or `zinc-*` in components.
- **Don't** hardcode color hex values in components. Document tokens here, but consume tokens in code.
- **Don't** use smooth easing, spring physics, scale hovers, animated layout properties, or decorative page choreography.
- **Don't** add side-stripe borders, gradient text, glassmorphism, the hero-metric template, identical card grids, or modal-first flows.
- **Don't** introduce `p-8` page shells, rounded cards, nested cards, decorative floating sections, or shadow-based hierarchy.
- **Don't** duplicate workflow strings, stage logic, platform names, role names, currency lists, or content-type values outside their shared constants and helpers.
- **Don't** replace the terminal UI with standard web defaults while fixing small bugs.
