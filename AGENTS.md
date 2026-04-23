# AI Agent Constitution: Studio_OS

**DO NOT DEVIATE FROM THESE RULES WHEN MODIFYING THIS CODEBASE.**

## I. The Prime Directive
Do not attempt to "normalize" or "refactor" the UI to standard web defaults. The terminal aesthetic is mandatory. Do not introduce generic corporate UI patterns, rounded borders, or bright colors.

## II. UI/UX & Tailwind System
* **Aesthetic:** Strict high-contrast, dark mode, terminal-inspired.
* **Colors:** Backgrounds MUST be `#0a0a0a` or `#0f0f0f`. Borders MUST be `white/10` or `gray-800`. Text MUST be white or `gray-400`.
* **Typography:** Heavy use of `font-mono`, `tracking-widest`, and `text-[10px]` for labels, IDs, file paths, and buttons. Uppercase text is heavily preferred for UI elements.
* **Forms:** NEVER use native `<input type="radio">` or default browser checkboxes. Use custom styled `<div>` or `<button>` elements that mimic terminal UI blocks.
* **Hydration:** Always use `color-scheme-dark` on standard text/date inputs so native browser popups match the dark theme without blinding the user.

## III. Drag-and-Drop (`dnd-kit`) Guardrails
* **Hydration Fix:** The `DndContext` MUST be wrapped in an `isMounted` state check (e.g., `useEffect` setting `true`) to prevent Next.js SSR hydration crashes.
* **Click Fix:** The `PointerSensor` MUST ALWAYS maintain an `activationConstraint` of `{ delay: 200, tolerance: 5 }` or `{ distance: 5 }`. Without this constraint, `dnd-kit` will swallow all `onClick` events on the Kanban cards.

## IV. State Management & Next.js Actions
* **Rule:** Server Actions mutate the database. When calling them from within a modal or a child component, you MUST trigger a local React state update in the parent board (via an `onProjectUpdate` callback) OR use `revalidatePath` on the server. This ensures Optimistic UI accurately syncs with SQLite without requiring a hard browser refresh.

## V. Database Schema Quirks
* **Shotlists:** `aRollShots` and `bRollShots` are stored in SQLite as JSON strings. You MUST parse them on the frontend (`JSON.parse`) and re-stringify them before passing them to Server Actions.
* **Transition Validation:** Strict Kanban column gating exists. For example, cards CANNOT move from `Filming` to `Editing` unless all items in both the parsed `aRollShots` and `bRollShots` arrays are marked `isCompleted: true`. Review rejection automatically loops cards back to `Editing`.
