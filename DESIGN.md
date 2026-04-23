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

### Borders
- **Border**: `#222222` (Subtle dividers, decorative/structural)
- **Border Visible**: `#333333` (Intentional outlines, component borders)

### Text
- **Text Display**: `#FFFFFF` (Headlines, hero metrics)
- **Text Primary**: `#E8E8E8` (Main body text, primary values)
- **Text Secondary**: `#999999` (Labels, captions, metadata)
- **Text Disabled**: `#666666` (Inactive elements, empty states)

### Accents & Data Status
*Status colors are applied to the value, not the background or label.*
- **Accent**: `#D71921` (Signal light, active states, urgent moments)
- **Interactive**: `#5B9BF6` (Links, selected elements, hover states)
- **Success**: `#4A9E5C` (Confirmed, completed, connected)
- **Warning**: `#D4A843` (Caution, pending, degraded)
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
- **lg** (24px): Group separation, kanban column gaps.
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
- **Side Navbar**: Fixed 256px wide (`w-64`), `bg-black`, `border-r` (`#222222`). Contains heavy `Space Mono` typography (`text-xl` `font-black`) for the logo, followed by version metadata. Navigation items use `Space Mono` (`text-[11px]`) with `px-3 py-2` padding and a 16px gap to their leading monoline icons. Active items use `bg-zinc-900` with `border border-zinc-700`.
- **Top Bar**: 64px tall (`h-16`), `bg-black`, `border-b` (`#222222`). Left side features an underlined global search input (`Space Mono`). Right side houses a pill-shaped primary action button (`bg-text-display` with `text-black` font).
- **Pipeline Columns**: `w-[320px]`. Header is bottom-bordered (`border-b border-border-visible`), featuring the column name (`uppercase text-text-primary`) and item count in brackets (e.g., `[ 2 ]` in `text-text-secondary`). Custom 6px mechanical scrollbar.
- **Pipeline Cards**: Sharp corners (`border border-border`), background `surface` (`#111111`), with `16px` padding (`p-md`). Tags are `text-[9px] uppercase border border-border-visible`. Progress bars use flex containers with `h-[2px]` and `2px` gaps. Nested checklists feature custom square checkboxes (`w-3 h-3 border-border-visible`).

### B. Project Details Modal
- **Overlay & Window**: `fixed inset-0`, `bg-black/85` with `backdrop-blur-sm`. Modal Container is `max-w-5xl`, `bg-surface`, surrounded by `border-visible` (`#333333`) acting as a rigid layer without drop shadows.
- **Header Structure**: `bg-surface-raised` background. Active status dot (`w-2 h-2 bg-interactive`), Mono ID, and uppercase title. Right side has a Doto `display-lg` percentage metric establishing the "visual moment".
- **Left Workspace**: Inputs built from structural elements (`bg-black border border-border`). Checklists use custom rigid checkboxes (`w-4 h-4 bg-text-primary` when checked, empty when unchecked) with a bold monoline check icon.
- **Right Metadata Column**: `bg-black` contrast block. Label is `text-text-secondary`, Value is `text-text-primary tracking-widest`. Platform Tags are boxy `bg-surface-raised border border-border-visible px-3 py-1`. Primary Action is a solid bottom-anchored button.

### C. Authentication (Login)
- **Container**: `max-w-sm px-lg` centered in the viewport.
- **Hero/Branding**: `text-display-xl` with `mix-blend-difference` to blend into backgrounds, accompanied by a structured separator (lines + `SYS_AUTH` text).
- **Form Inputs**: Minimalist. No bounding boxes. `border-b border-border-visible bg-transparent`. Text is `text-display` in `font-caption`. Label sits above, shifting to `text-text-display` on focus.
- **Buttons**: Pill-shaped (`rounded-full`), `min-w-[160px]`, `bg-text-display text-black`.

### D. Analytics & Dashboards
- **Metric Cards**: `bg-surface p-xl min-h-[240px]`. Upper left label `font-label`, upper right monoline icon. Center metric `display-xl`, with currency/percentage suffixes in `display-lg`. Trend indicators with directional arrow and `success`/`accent` color.
- **Segmented Goals**: Giant 48px (`h-12`) segmented bars. Filled segments use `bg-text-display`, empty segments use `bg-transparent border border-border-visible`.
- **Platform Distribution**: Inline linear charts using a `1.5px bg-text-display` foreground line over a `1px bg-border-visible` background line, creating a precise mechanical slider aesthetic.

### E. Settings & Forms
- **Layout Architecture**: Max width 5xl. Categories separated by top borders `border-t border-border-visible pt-xl`.
- **Toggles**: Pill-shaped track `w-11 h-6 bg-surface-highest border border-border-visible`.
- **Cache Bar**: Blocky segmented chunks for usage indicators using `bg-text-display` and `bg-surface-highest` combinations.
- **File Path Browsers**: Transparent under-bordered inputs, paired with a sharp-edged `border-border-visible` button.
- **Save Action Area**: Sticky bottom container with `bg-gradient-to-t from-background to-transparent`, containing a right-aligned pill button.

### F. Team & Status Grids
- **Bento Grid Layout**: Responsive grid (`md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) with `gap-md`.
- **Member Cards**: `bg-surface border-border-visible p-lg`. Top section features circular avatar and a cluster of 3 status dots (`w-2 h-2`).
- **Status Dots**: Represent capacity. Filled green (`bg-success`) = capacity. Filled red (`bg-accent`) = overcapacity. Empty = available.
- **Alert States (Overcapacity)**: Uses a dramatic `blur-2xl` glow effect in the top corner (`bg-accent-subtle`) and changes card border to `outline-variant`. Red text highlights critical states.

### G. Data Tables (Sponsorships)
- **Table Structure**: `w-full border-collapse`. Header row `bg-surface-raised/30` with `py-md px-lg` and `font-label`.
- **Rows**: `border-b border-border-visible hover:bg-surface-raised`. Data is structured with hierarchy (e.g. Subheading for deal name, Caption for details).
- **Status Cells**: Right-aligned, featuring a `w-2 h-2` colored dot next to text (PAID = green, PENDING = yellow, OVERDUE = red).
- **Filtering**: Inline text links `font-label text-text-secondary`, active state indicated by `border-b-2 border-text-display text-text-display`.

---

## 5. Animation & Motion
- **Durations**: 150-250ms for micro-interactions, 300ms for transitions.
- **Easing**: `cubic-bezier(0.25, 0.1, 0.25, 1)` (Subtle ease-out, no bounce).
- **Styles**: Mechanical and precise. Hover states change brightness and border color, never scale, and never drop shadows. Transparency and opacity are preferred over sliding movement.
