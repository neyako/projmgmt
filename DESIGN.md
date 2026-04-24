# Nothing Design System - Source of Truth

This document serves as the absolute source of truth for the project's UI, based on the Nothing Design philosophy (Swiss typography, industrial design, and monochromatic emphasis). Every component, color, and spacing choice must adhere strictly to these guidelines.

---

## 1. Color Palette

The interface operates primarily in a dark mode context, resembling an instrument panel in a dark room. Color is reserved for data status, events, and highlights—not for decoration.

### Backgrounds & Surfaces
- **Black (OLED)**: `#000000` (Main app background, sidebars)
- **Background**: `#141313` (Main canvas behind cards)
- **Surface**: `#111111` (Default cards and modals)
- **Surface Raised**: `#1A1A1A` (Elevated components, headers, active states)
- **Surface Variant**: `#353434`
- **Surface Bright**: `#3a3939`

### Borders
- **Border**: `#222222` (Subtle dividers, decorative/structural)
- **Border Visible**: `#333333` (Intentional outlines, component borders)
- **Outline Variant**: `#444748`

### Text
- **Text Display**: `#FFFFFF` (Headlines, hero metrics)
- **Text Primary**: `#E8E8E8` (Main body text, primary values)
- **Text Secondary**: `#999999` (Labels, captions, metadata)
- **Text Disabled**: `#666666` (Inactive elements, empty states)

### Accents & Data Status
*Status colors are applied to the value, not the background or label.*
- **Accent**: `#D71921` (Signal light, active states, urgent moments, destructive actions)
- **Accent Subtle**: `rgba(215, 25, 33, 0.15)` (Glows, alert backgrounds)
- **Interactive**: `#5B9BF6` (Links, selected elements, hover states, "Ideation" pipeline stage)
- **Success**: `#4A9E5C` (Confirmed, completed, connected, "Published" status)
- **Warning**: `#D4A843` (Caution, pending, degraded, "Filming/Editing" active status)
- **Error**: `#ffb4ab` (Critical failures)

---

## 2. Typography Scale & Fonts

The system uses maximum 3 font families per screen, balancing precision and utility.

**Families:**
- **Display**: `Doto` (Dot-matrix variable font for hero metrics and major numbers)
- **Heading / Body**: `Space Grotesk` (Light 300, Regular 400, Medium 500, Bold 700)
- **Labels / Data**: `Space Mono` (Regular 400, Bold 700)

**Type Scale:**
| Role | Size | Line Height | Tracking | Font & Weight |
| --- | --- | --- | --- | --- |
| **Display XL** | 72px | 1.0 | -0.03em | Doto |
| **Display LG** | 48px | 1.05 | -0.02em | Doto |
| **Display MD** | 36px | 1.1 | -0.02em | Space Grotesk 500 |
| **Heading** | 24px | 1.2 | -0.01em | Space Grotesk 500 |
| **Subheading**| 18px | 1.3 | 0 | Space Grotesk 400 |
| **Body** | 16px | 1.5 | 0 | Space Grotesk 400 |
| **Body SM** | 14px | 1.5 | +0.01em | Space Grotesk 400 |
| **Caption** | 12px | 1.4 | +0.04em | Space Mono 400 |
| **Label** | 11px | 1.2 | +0.08em | Space Mono 700 (ALL CAPS) |

---

## 3. Spacing & Padding Rules

Spacing conveys relationship and hierarchy. We rely heavily on exact rhythm over borders.

**Scale (8px Base):**
- **2xs** (2px): Optical adjustments and tight segmented gaps.
- **xs** (4px): Icon-to-label gaps, tightest padding.
- **sm** (8px): Component internal spacing (e.g., inside cards).
- **md** (16px): Standard padding, gaps between form items.
- **lg** (24px): Group separation, kanban column gaps, primary page margins (`p-lg`).
- **xl** (32px): Section margins, modal padding.
- **2xl** (48px): Major section breaks.
- **3xl** (64px): Page-level vertical rhythm.
- **4xl** (96px): Hero breathing room.

**Corner Shapes:**
- **Sharp Edge (0px)**: The default for cards, boards, and modals.
- **Radius DEFAULT (4px)** / **lg (8px)**: Only for specific internal UI controls (rarely used).
- **Pill (9999px)**: Avatars, indicator dots, and primary global action buttons (e.g., "New Project").

---

## 4. Component Structures

### A. Kanban Pipeline
- **Side Navbar**: Fixed 256px wide (`w-64`), `bg-black`, `border-r` (`border-white/10`). Contains heavy `Space Mono` typography (`text-xl` `font-black`) for the logo, followed by version metadata. Navigation items use `Space Mono` (`text-[11px]`) with `px-3 py-2` padding and a 16px gap to their leading monoline icons. Active items use `bg-zinc-900` with `border border-zinc-700`.
- **Top Bar**: 64px tall (`h-16`), `bg-black`, `border-b` (`border-white/10`). Left side features an underlined global search input (`Space Mono`). Right side houses a pill-shaped primary action button (`bg-white` with `text-black` font) and avatar routing to `/settings`.
- **Pipeline Columns**: `w-[320px]`. Header is bottom-bordered (`border-b border-border-visible`), featuring the column name (`uppercase text-text-primary`) and item count in brackets (e.g., `[ 2 ]` in `text-text-secondary`). Custom 6px mechanical scrollbar.
- **Pipeline Cards**: Sharp corners (`border border-border`), background `surface` (`#111111`), with `16px` padding (`p-md`). Tags are `text-[9px] uppercase border border-border-visible`. Progress bars use flex containers with `h-[2px]` and `2px` gaps. Nested checklists feature custom square checkboxes (`w-3.5 h-3.5 border-border-visible`). Rejection feedback forces an `accent/30` border glow and injects an `accent-subtle` note block.

### B. Modals (Project Details, Publish, Sponsorship, Team)
- **Overlay & Window**: `fixed inset-0`, `bg-black/90` with `backdrop-blur-md`. Modal Container is `max-w-5xl` (or smaller variant), `bg-[#0f0f0f]`, surrounded by `border-white/10` acting as a rigid layer without drop shadows.
- **Header Structure**: `p-6 border-b border-white/10` background. Active status dot matches pipeline semantic colors, Mono ID, and uppercase title. Right side has a Doto percentage metric or standard "X" close.
- **Workspace**: Inputs built from structural elements (`bg-black border border-white/10` or transparent border-bottom). Buttons use bracket notation `[ APPROVE ]` or sharp high-contrast fills (`bg-white text-black`).
- **Asset Management RAW Row**: Single attached control strip (`bg-black border border-white/10`) with left `RAW` label cell, center editable/view state, and right utility actions. View state shows OS badge (`[  ]` / `[ ⊞ ]`) and generated NAS path. Edit state is inline text input with Enter-to-save behavior.
- **Interactive Metadata Sidebar**: Platform chips and Pipeline Stage list support click-to-update with hover color transitions and disabled pending states, while preserving terminal typography.
- **Destructive Actions**: ALWAYS map to `text-accent border-accent/40 hover:bg-accent-subtle`. No raw `red-500` palette colors.

### C. Authentication (Login)
- **Container**: `max-w-[24rem] px-lg` centered in the viewport.
- **Hero/Branding**: `text-style-display-xl` with `mix-blend-difference` to blend into backgrounds, accompanied by a structured separator (lines + `SYS_AUTH` text).
- **Form Inputs**: Minimalist. No bounding boxes. `border-b border-border-visible bg-transparent`. Text is `text-display` in `font-caption`. Label sits above, shifting to `text-text-display` on focus.
- **Buttons**: Pill-shaped (`rounded-full`), `min-w-[160px]`, `bg-text-display text-black`.

### D. Dashboards, Tables & List Pages (Archive, Sponsorships, Analytics, Team)
- **Page Container Layout**: Unified to `<div className="h-full w-full overflow-auto p-lg">` with a `mb-6` header wrapper block across all tabular data screens to ensure width parity.
- **Data Tables**: `w-full border-collapse`. Header row with `p-4` and `font-label uppercase tracking-widest text-gray-500 text-[10px]`.
- **Rows**: `border-b border-white/5 hover:bg-white/5`. Data is structured with hierarchy (e.g. Subheading for title, Caption for details).
- **Archive Metric Cells**: Views/Likes/Comments in Archive tables must render grand totals from platform columns (`youtube* + meta* + tiktok*`) and display with locale separators (e.g. `toLocaleString()`).
- **Analytics Performer Rows**: Platform chips (`YT`, `IG`, `TT`) and per-platform metric strings render only for selected/synced platforms. Format badges (`Short Form`, `Long Form`) sit inline with the title using tiny bordered uppercase tokens.
- **Status Cells**: Inline text links `font-label text-text-secondary`, featuring a `w-1.5 h-1.5 rounded-full` token-colored dot.
- **Tab Filters**: Huge uppercase typography `text-2xl font-bold tracking-wider`. Inactive tabs use `text-gray-600`, active uses `text-white` bracketed `[ ACTIVE ]`. Header actions (like `NEW SPONSORSHIP`) align to the right side of the bottom-bordered tab row.

### E. Settings
- **Layout Architecture**: Max width 48rem. Categories separated by top borders `border-t border-white/10 pt-8`.
- **Inputs**: Transparent under-bordered inputs `border-b border-white/10`.
- **Save Action Area**: Bottom-anchored right-aligned sharp button `bg-white text-black`.

---

## 5. Animation & Motion
- **Durations**: 150-250ms for micro-interactions, 300ms for transitions.
- **Easing**: `cubic-bezier(0.25, 0.1, 0.25, 1)` (Subtle ease-out, no bounce).
- **Styles**: Mechanical and precise. Hover states change brightness and border color, never scale, and never drop shadows. Transparency and opacity are preferred over sliding movement.
