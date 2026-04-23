# AI Agent Constitution: Studio_OS

**DO NOT DEVIATE FROM THESE RULES WHEN MODIFYING THIS CODEBASE.**

## 1. UI/UX & Styling Dictates
* **Aesthetic:** High-contrast, dark mode, terminal-inspired. 
* **Colors:** Backgrounds are `#0a0a0a` or `#0f0f0f`. Borders are `white/10` or `gray-800`. Text is white or `gray-400`.
* **Typography:** Use `font-mono` and `tracking-widest` for all labels, IDs, file paths, and buttons. 
* **Forms:** NEVER use standard `<input type="radio">` or default checkboxes. Use custom styled `<div>` or `<button>` elements that mimic terminal UI blocks.
* **Hydration:** Always use `color-scheme-dark` on standard text/date inputs so native browser popups match the dark theme.

## 2. Drag-and-Drop (`dnd-kit`) Safety
* The `DndContext` must be wrapped in an `isMounted` check to prevent Next.js SSR hydration crashes.
* The `PointerSensor` must ALWAYS maintain an `activationConstraint` of `{ distance: 5 }` to prevent it from swallowing `onClick` events on cards.

## 3. Database Rules (Prisma + SQLite)
* `aRollShots` and `bRollShots` are stored as stringified JSON arrays. They must be parsed on the frontend and re-stringified before saving to the database.
* **Validation:** Cards cannot move from "Filming" to "Editing" unless all items in both `aRollShots` and `bRollShots` are marked `isCompleted: true`.

## 4. State Management
* When a Server Action mutates the database from within a modal or a child component, you must trigger a local React state update in the parent board (via callback) OR use `revalidatePath` to ensure the UI stays synchronized with SQLite.
