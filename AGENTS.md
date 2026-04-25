# AI Agent Guide: projmgmt

**DO NOT DEVIATE FROM THESE RULES WHEN MODIFYING THIS CODEBASE.**

This file is the operating manual for AI assistants working in this repository. It combines the project constitution with the current codebase structure, workflows, and implementation conventions.

## 1. Prime Directive

Do not attempt to "normalize" or "refactor" the UI to standard web defaults. The terminal aesthetic is mandatory. Do not introduce generic corporate UI patterns, rounded borders, decorative gradients, or raw Tailwind palette colors such as `red-500`, `green-400`, or `emerald-500`. Everything visual must route through `DESIGN.md`, `src/app/globals.css`, and the semantic Tailwind theme tokens.

This is a dark, high-contrast, terminal-inspired production dashboard. Preserve that identity even when fixing small bugs.

## 2. Project Snapshot

- **Product:** Self-hosted content production management dashboard for a small video team.
- **Framework:** Next.js 15 App Router with React 19.
- **Database:** Prisma ORM with SQLite, stored at `prisma/dev.db`.
- **Auth:** NextAuth v4 Credentials provider with Prisma adapter and JWT sessions.
- **Styling:** Tailwind CSS v4 through `@theme` tokens in `src/app/globals.css`.
- **Drag and drop:** `@dnd-kit/core` and `@dnd-kit/sortable`.
- **External integrations:** YouTube Data API, Meta Graph API, TikTok RapidAPI, Nextcloud, and NAS path generation.
- **Package manager:** npm. A `package-lock.json` is present.

## 3. Repository Map

- `src/app/` - App Router pages, layouts, API routes, global styles, settings forms, and app-level Server Actions.
- `src/actions/` - Primary Server Actions for database mutations. Prefer these for UI mutations.
- `src/components/` - Feature and UI components.
- `src/components/kanban/` - Pipeline board, dnd-kit setup, cards, columns, review controls, shotlist UI.
- `src/components/modals/` - Project, publish, sponsorship, team, and stats modal workflows.
- `src/components/layout/` - Persistent app shell, sidebar, and top bar.
- `src/components/ui/` - Small reusable terminal-style UI primitives.
- `src/lib/` - Prisma singleton, auth options, constants, role types, and helpers.
- `src/services/` - Cron and external platform fetch helpers.
- `src/types/` - Shared app types over Prisma models.
- `src/utils/` - Utility modules such as NAS path generation.
- `prisma/schema.prisma` - Database schema. Many fields are stringified JSON by design.
- `prisma/seed.ts` - Local seed script. It deletes existing users, projects, shotlist items, and analytics before seeding.
- `DESIGN.md` - Source of truth for visual design.
- `README.md` - Product overview and local setup.
- `CLAUDE.md` - General LLM caution guidelines. Follow it where it does not conflict with this file.

## 4. Development Commands

Use npm.

```bash
npm install
npm run dev
npm run build
npm run start
npm run db:push
npm run db:seed
npm run db:studio
```

Important notes:

- `npm run dev` runs `next dev --turbopack`.
- `npm run build` is the main verification command available in `package.json`.
- There is currently no configured `lint` or `test` script.
- `npm run db:push` pushes `prisma/schema.prisma` to SQLite.
- `npm run db:seed` is destructive. It clears existing app data before inserting sample data.
- `postinstall` runs `prisma generate`.

## 5. Environment Variables

Do not read or expose secret values from `.env` unless explicitly asked. When adding behavior, document variable names but never commit credentials.

Known variables used by the codebase:

- `DATABASE_URL` - Prisma SQLite connection.
- `NEXT_PUBLIC_NAS_IP` - NAS host used for generated SMB paths.
- `NEXT_PUBLIC_NAS_SHARE` - NAS share name.
- `NEXT_PUBLIC_NAS_ROOT_DIR` - NAS root directory.
- `YOUTUBE_API_KEY` - YouTube stats sync.
- `META_ACCESS_TOKEN` - Meta stats sync.
- `TIKTOK_RAPIDAPI_HOST` - TikTok stats sync host.
- `TIKTOK_RAPIDAPI_KEY` - TikTok stats sync key.
- `NEXTCLOUD_URL`, `NEXTCLOUD_USER`, `NEXTCLOUD_PASSWORD` - Nextcloud folder/share action support.

## 6. Architecture Conventions

- App pages are mostly Server Components that query Prisma directly, then pass data into client components.
- Mutations should usually live in `src/actions/*` as Server Actions.
- Legacy API routes exist under `src/app/api/*`; do not add new mutation flows there unless an API endpoint is specifically required.
- Use the Prisma singleton from `src/lib/prisma.ts`.
- Use the `@/*` import alias from `tsconfig.json`.
- Shared constants live in `src/lib/constants.ts`; do not duplicate stage, role, platform, content type, or format strings.
- Shared types live in `src/types/index.ts`. Keep these aligned with Prisma relation includes.
- Client components that call Server Actions must update local React state, call `router.refresh()`, and/or rely on `revalidatePath` so SQLite changes are reflected without a hard refresh.

## 7. Routing and Access Control

Main routes:

- `/` redirects to `/pipeline`.
- `/pipeline` shows non-archived projects on the Kanban board.
- `/archive` shows `Published` and `Scrapped` projects.
- `/analytics` shows platform-specific analytics totals for published projects.
- `/sponsorships` manages sponsorship CRM rows.
- `/team` manages users.
- `/settings` manages the current user's avatar and password.
- `/login` is the Credentials sign-in page.

Auth and RBAC:

- Roles are `ADMIN`, `MANAGER`, and `MEMBER` in `src/lib/roles.ts`.
- `src/middleware.ts` requires auth for app routes except API/static/login paths.
- `MEMBER` users are blocked from `/analytics`, `/sponsorships`, and `/team`.
- The sidebar also hides those routes for `MEMBER`.
- NextAuth session fields are extended with `id`, `role`, `username`, and `avatarUrl`.

## 8. UI/UX and Tailwind System

The terminal aesthetic is a hard requirement.

- Backgrounds must be `#0a0a0a`, `#0f0f0f`, `bg-background`, `bg-black`, `bg-surface`, or related semantic tokens.
- Borders should use `border-white/10`, `border-white/5`, `border-border`, or `border-border-visible`.
- Status and accent colors must use semantic tokens: `text-success`, `bg-warning`, `border-accent`, `bg-accent-subtle`, `text-error`, etc.
- Do not add raw Tailwind palette colors like `text-red-500`, `bg-emerald-500`, or `border-green-400`. If you find old violations while working nearby, fix them only when in scope.
- Typography leans heavily on `font-mono`, `font-label`, `text-style-label`, uppercase labels, `tracking-widest`, and `text-[10px]`.
- Standard tabular/list page containers should use `h-full w-full overflow-auto p-lg` with a `mb-6` header block.
- Do not introduce `p-8` on new page containers. Normalize to `p-lg` when touching an affected page for a related reason.
- Forms and modals use sharp edges. Avoid generic rounded cards.
- Native checkboxes and radio buttons are not allowed for visible controls. Use custom `button`, `div`, or existing UI primitives with ARIA where appropriate.
- Standard text/date inputs should include `color-scheme-dark` when native browser UI can appear.
- Use existing utility classes in `globals.css`: `ui-panel`, `ui-button-outline`, `ui-button-danger`, `ui-table-head`, `ui-table-row`, `ui-table-cell`, `ui-tag-muted`, etc.
- `DESIGN.md` is the visual source of truth. When in doubt, follow it over default Tailwind instincts.

## 9. Drag-and-Drop Guardrails

The Kanban board has two critical dnd-kit constraints:

- `DndContext` must remain behind an `isMounted` guard in `KanbanBoardWrapper`. This prevents Next.js hydration crashes.
- `PointerSensor` must always use an activation constraint. Current code uses:

```ts
activationConstraint: {
  delay: 200,
  tolerance: 5,
}
```

An acceptable alternative is `{ distance: 5 }`. Without this, dnd-kit swallows normal card click events.

When changing drag behavior, preserve optimistic updates, failed-move rollback, and toast errors.

## 10. Kanban Pipeline Rules

Stages are defined in `KANBAN_STAGES`:

- `Ideation`
- `Scripting`
- `Filming`
- `Editing`
- `Review`
- `Published`

Transition rules are defined in `VALID_TRANSITIONS`. Do not hardcode a second source of truth.

Important workflow rules:

- Pipeline pages exclude `Published` and `Scrapped` projects.
- Archive pages show `Published` and `Scrapped` projects.
- `Filming -> Editing` is blocked unless every parsed item in both `aRollShots` and `bRollShots` has `isCompleted: true`.
- `Editing -> Review` requires a `reviewLink`.
- Review rejection moves the project back to `Editing` and stores `reviewFeedback`.
- Resubmitting from `Editing` to `Review` clears `reviewFeedback`.
- Moving to `Published` must be intercepted by `PublishModal`; it captures final metadata before the transition completes.
- Direct stage updates in the Project Details sidebar are interactive controls, not static metadata. Keep optimistic updates and rollbacks intact.

## 11. Prisma and Data Shape

The schema intentionally stores several arrays as JSON strings in SQLite. Parse on the frontend and stringify before Server Actions:

- `platformsTargeted`
- `aRollShots`
- `bRollShots`
- `abTitles`
- `thumbnails`

Shot JSON shape:

```ts
type ShotItem = {
  id: string;
  text: string;
  isCompleted: boolean;
};
```

Other schema notes:

- `Project.status` can also be `Scrapped` even though it is not in `KANBAN_STAGES`.
- `folderName` is the source of truth for local media location. Do not hardcode SMB roots in components.
- `storagePath` is legacy/secondary; generated RAW paths should come from `folderName` plus NAS env vars.
- `publishDate` and `publishedAt` both exist. Publishing workflows currently set both to the selected publish date.
- Generic `views`, `likes`, and `comments` still exist but are legacy rollups for display purposes.
- Platform-specific analytics columns are authoritative for Archive and Analytics totals:
  - `youtubeViews`, `metaViews`, `tiktokViews`
  - `youtubeLikes`, `metaLikes`, `tiktokLikes`
  - `youtubeComments`, `metaComments`, `tiktokComments`

## 12. Analytics and Platform Sync

- Manual and sync actions live mainly in `src/actions/projects.ts`.
- YouTube sync uses `YOUTUBE_API_KEY` and batches IDs in groups of 50.
- Meta sync uses `META_ACCESS_TOKEN` and Graph API fields for views, likes, and comments.
- TikTok sync uses `TIKTOK_RAPIDAPI_HOST` and `TIKTOK_RAPIDAPI_KEY`.
- Sync actions update platform-specific columns and revalidate `/analytics` and `/archive`.
- Archive and Analytics UI must compute totals from platform-specific columns, not the legacy rollup fields.
- Top performer rows must render platform chips and per-platform metric strings conditionally from targeted/synced platforms.
- Short Form / Long Form badges derive from `platformsTargeted`, not from a global assumption.

## 13. NAS and Nextcloud

- NAS path generation lives in `src/utils/nasPaths.ts`.
- Use `generateNasPaths(folderName, status, publishDate)` rather than building SMB paths inline.
- Generated paths use:
  - macOS: `smb://<host>/<share>/<root>/<subdir>/<folder>`
  - Windows: `\\<host>\<share>\<root>\<subdir>\<folder>`
- `Published` projects map to `Done/<year>`.
- Other active projects map to `Working` unless explicitly handled.
- Nextcloud actions live in `src/actions/nextcloud.ts`; credentials come from env vars.

## 14. Server Action State Sync

Server Actions mutate the database, but UI state must still be updated locally or refreshed.

Required patterns:

- Modal child updates should call parent callbacks such as `onProjectUpdate`, `onPublished`, `onRefresh`, or `onCreated`.
- If a mutation affects a server-rendered list, use `router.refresh()` in the client or `revalidatePath()` in the action.
- Optimistic updates must rollback on failed Server Actions.
- Platform chips and stage rows in `ProjectDetailsModal` are interactive controls. Keep `platformsTargeted` JSON and `status` synchronized with local board state.
- Published cards leave the pipeline list after `publishProject` succeeds.

## 15. Component Conventions

- Prefer existing components and helpers before creating new abstractions.
- Use `cn` from `src/lib/utils.ts` for conditional classes.
- Use Material Symbols where the existing layout uses them; `lucide-react` is already used in the top bar dropdown.
- Buttons and controls should use bracketed terminal copy where the surrounding UI does.
- Do not wrap page sections in decorative cards. Cards are for repeated items, modals, and actual framed tools.
- Avoid shadows, scaling hover animations, blur-heavy surfaces, and soft corporate UI patterns.
- Keep labels uppercase and compact.
- Use `toLocaleString("en-US")` or existing number/date helpers for display formatting.

## 16. API Routes

Existing API routes:

- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/route.ts`
- `src/app/api/projects/[id]/move/route.ts`
- `src/app/api/projects/[id]/shotlist/route.ts`
- `src/app/api/analytics/route.ts`
- `src/app/api/users/route.ts`
- `src/app/api/auth/[...nextauth]/route.ts`

These are available, but the active UI generally uses Server Actions. When adding or fixing UI mutations, prefer the Server Action path so `revalidatePath`, optimistic state, and typed action results remain consistent.

## 17. Verification Checklist

For code changes, run the narrowest useful verification available.

- For most source changes: `npm run build`.
- For Prisma schema changes: `npm run db:push`, then regenerate Prisma if needed.
- For seed/data-shape changes: be explicit that `npm run db:seed` wipes local data.
- For UI changes: run the dev server and inspect the affected route in a browser when feasible.
- For Kanban changes: manually verify card click opens the modal, drag still works, invalid transitions show toasts, and publish opens the checklist modal.
- For Archive/Analytics changes: verify totals are computed from platform-specific metrics.
- For auth/RBAC changes: verify `MEMBER` cannot access blocked routes.

If no automated test or lint command exists for the touched area, say that in the final response.

## 18. Editing Discipline

- Keep changes surgical. Do not refactor unrelated code.
- Do not reformat files wholesale.
- Do not alter `.env`, `prisma/dev.db`, generated build output, or user-uploaded files unless explicitly requested.
- The worktree may be dirty. Never revert unrelated user changes.
- Do not add dependencies unless the task truly requires them.
- Do not migrate JSON-string fields to normalized tables unless explicitly asked; current SQLite quirks are part of the app contract.
- Preserve the terminal UI even when adding validation, loading states, empty states, or errors.
