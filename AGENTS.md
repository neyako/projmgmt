# AI Agent Guide: projmgmt

**DO NOT DEVIATE FROM THESE RULES WHEN MODIFYING THIS CODEBASE.**

This file is the operating manual for AI assistants working in this repository. It combines the project constitution with the current codebase structure, workflows, and implementation conventions.

## 1. Prime Directive

Do not attempt to "normalize" or "refactor" the UI to standard web defaults. The terminal aesthetic is mandatory. Do not introduce generic corporate UI patterns, rounded borders, decorative gradients, or raw Tailwind palette colors such as `red-500`, `green-400`, or `emerald-500`. Everything visual must route through `DESIGN.md`, `src/app/globals.css`, and the semantic Tailwind theme tokens.

This is a high-contrast, terminal-inspired production dashboard with dark as the default and token-driven light-mode parity. Preserve that identity even when fixing small bugs.

## 2. Project Snapshot

- **Product:** Self-hosted content production management dashboard for a small video team.
- **Framework:** Next.js 15 App Router with React 19.
- **Database:** Prisma ORM with SQLite, stored at `prisma/dev.db`.
- **Auth:** NextAuth v4 Credentials provider with Prisma adapter and JWT sessions.
- **Styling:** Tailwind CSS v4 through `@theme` tokens in `src/app/globals.css`.
- **Drag and drop:** `@dnd-kit/core` and `@dnd-kit/sortable`.
- **External integrations:** YouTube Data API, Meta Graph API, TikTok RapidAPI, ExchangeRate-API Open Access, Nextcloud, and NAS path generation.
- **Package manager:** npm. A `package-lock.json` is present.

## 3. Repository Map

```
/
├── prisma/
│   ├── schema.prisma      # Single source of truth for the DB schema
│   └── seed.ts            # Destructive seed — clears users/projects/analytics first
├── public/
│   └── avatars/           # User avatar images (served via /api/avatars/[filename])
└── src/
    ├── actions/           # Next.js Server Actions (all DB mutations)
    │   ├── auth.ts        # changePassword
    │   ├── nextcloud.ts   # Legacy WebDAV folder creation (use src/lib/nextcloud.ts for new work)
    │   ├── projects.ts    # All project CRUD, status transitions, analytics sync
    │   ├── settings.ts    # User preferences (currency, locale)
    │   ├── sponsorships.ts # Sponsorship CRUD
    │   └── team.ts        # User CRUD (create / update / delete)
    ├── app/               # Next.js App Router pages & API routes
    │   ├── layout.tsx     # Root layout (fonts, Providers wrapper)
    │   ├── globals.css    # @theme tokens, mode palettes, base styles, utility classes
    │   ├── providers.tsx  # SessionProvider + ThemeProvider
    │   ├── actions.ts     # Top-level server actions (avatar upload)
    │   ├── page.tsx       # Root: redirects to /setup (no users) or /pipeline
    │   ├── setup/         # /setup — first-run ADMIN account creation
    │   ├── login/         # /login — credentials sign-in page
    │   ├── pipeline/      # /pipeline — Kanban board (Server Component data fetch)
    │   ├── archive/       # /archive — Published + Scrapped projects table
    │   ├── analytics/     # /analytics — Metrics dashboard (MANAGER/ADMIN only)
    │   ├── sponsorships/  # /sponsorships — Multi-currency brand deal CRM (MANAGER/ADMIN only)
    │   ├── team/          # /team — Team member management (MANAGER/ADMIN only)
    │   ├── settings/      # /settings — Avatar, password, language, preferred currency
    │   └── api/
    │       ├── auth/[...nextauth]/  # NextAuth handler
    │       ├── avatars/[filename]/  # Serves uploaded avatar images
    │       ├── projects/            # REST API for projects (legacy/external use)
    │       │   ├── route.ts         # GET list, POST create
    │       │   └── [id]/
    │       │       ├── route.ts     # GET single, PATCH update, DELETE
    │       │       ├── move/route.ts # POST — status transition
    │       │       └── shotlist/route.ts # GET/POST shotlist items
    │       ├── analytics/route.ts   # GET analytics summary
    │       └── users/route.ts       # GET users list
    ├── components/
    │   ├── analytics/
    │   │   └── SyncButton.tsx       # Triggers platform stats sync actions
    │   ├── archive/
    │   │   └── ArchiveTable.tsx     # Table of Published + Scrapped projects
    │   ├── kanban/
    │   │   ├── KanbanBoardWrapper.tsx # Client wrapper with isMounted dnd-kit SSR guard
    │   │   ├── KanbanBoard.tsx       # DndContext + column layout
    │   │   ├── KanbanColumn.tsx      # Single pipeline column with droppable zone
    │   │   ├── KanbanCard.tsx        # Draggable project card (standard stages)
    │   │   ├── FilmingSplitCard.tsx  # Card variant for Filming stage (A/B roll split)
    │   │   ├── ShotlistChecklist.tsx # A-Roll / B-Roll shot checklist UI
    │   │   ├── ShotRow.tsx           # Individual shot item row
    │   │   ├── ReviewPanel.tsx       # Approve / Reject panel for Review stage
    │   │   └── CardMenu.tsx          # Per-card context menu (archive, delete, etc.)
    │   ├── layout/
    │   │   ├── Shell.tsx             # Full-page layout wrapper (Sidebar + content area)
    │   │   ├── Sidebar.tsx           # Fixed left nav (256px, NAV_ITEMS from constants)
    │   │   └── TopBar.tsx            # 64px top bar (search, New Project button, avatar)
    │   ├── modals/
    │   │   ├── ProjectDetailsModal.tsx # Full project editor (metadata, assets, assignees)
    │   │   ├── PublishModal.tsx        # Publishing checklist (final title, IDs, captions)
    │   │   ├── SponsorshipModal.tsx    # Create / edit sponsorship deal
    │   │   ├── TeamMemberModal.tsx     # Create / edit team member
    │   │   └── UpdateStatsModal.tsx    # Manual analytics entry form
    │   ├── providers/
    │   │   └── SessionProvider.tsx    # NextAuth SessionProvider client boundary
    │   ├── sponsorships/
    │   │   └── SponsorshipsClient.tsx # Client component for sponsorship table + modal
    │   ├── team/
    │   │   └── TeamClient.tsx         # Client component for team table + modal
    │   └── ui/                        # Small reusable terminal-style UI primitives
    │       ├── Button.tsx, Checkbox.tsx, CopyBlock.tsx, Input.tsx
    │       ├── ProgressBar.tsx, StatusDot.tsx, Tag.tsx, Toast.tsx
    ├── lib/
    │   ├── auth.ts          # NextAuth authOptions (CredentialsProvider + JWT callbacks)
    │   ├── constants.ts     # KANBAN_STAGES, VALID_TRANSITIONS, PLATFORMS, NAV_ITEMS, etc.
    │   ├── currency.ts      # Supported currencies + money formatting helpers
    │   ├── currencyRates.ts # Exchange-rate fetch + CurrencyRate cache management
    │   ├── i18n/locales.ts  # toIntlLocale() for locale-aware date formatting
    │   ├── nextcloud.ts     # Active Nextcloud service (WebDAV client, folder ops, draft scan)
    │   ├── prisma.ts        # Singleton PrismaClient
    │   ├── roles.ts         # USER_ROLES = ["ADMIN", "MANAGER", "MEMBER"]
    │   └── utils.ts         # cn() and shared helpers
    ├── services/
    │   ├── cron.ts          # node-cron: daily analytics + daily currency rate refresh
    │   ├── meta.ts          # Meta Graph API helpers
    │   ├── tiktok.ts        # TikTok RapidAPI helpers
    │   └── youtube.ts       # YouTube Data API v3 helpers
    ├── types/
    │   ├── index.ts         # ProjectWithRelations, ProjectCardData, ShotItem, API payloads
    │   └── next-auth.d.ts   # Session augmentation (id, role, username, avatarUrl)
    ├── utils/
    │   └── nasPaths.ts      # generateNasPaths() — builds macPath + winPath from env vars
    ├── middleware.ts         # Auth guard + MEMBER role blocking + /avatars rewrite
    └── instrumentation.ts   # Next.js instrumentation hook
```

High-level directory notes:

- `src/app/` — App Router pages, layouts, API routes, global styles, settings forms, and app-level Server Actions.
- `src/actions/` — Primary Server Actions for database mutations. Prefer these for UI mutations.
- `src/lib/` — Prisma singleton, auth options, constants, role types, currency helpers, i18n helpers, and Nextcloud service code.
- `src/services/` — Cron, exchange-rate refresh scheduling, and external platform fetch helpers.
- `prisma/schema.prisma` — Database schema. Many fields are stringified JSON by design.
- `DESIGN.md` — Source of truth for visual design.
- No tracked `CLAUDE.md` is currently present. Treat this file and `DESIGN.md` as the contributor and AI-assistant source of truth.

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

| Variable | Used By | Description |
|---|---|---|
| `DATABASE_URL` | Prisma | SQLite file path, e.g. `file:./dev.db` |
| `NEXTAUTH_URL` | NextAuth | Canonical app URL |
| `NEXTAUTH_SECRET` | NextAuth | JWT signing secret |
| `NEXT_PUBLIC_NAS_IP` | `generateNasPaths` | Public/build-time NAS host fallback |
| `NEXT_PUBLIC_NAS_SHARE` | `generateNasPaths` | Public/build-time NAS share fallback |
| `NEXT_PUBLIC_NAS_ROOT_DIR` | `generateNasPaths` | Public/build-time NAS root dir fallback |
| `NAS_IP`, `NAS_SHARE`, `NAS_ROOT_DIR` | Server path display | Runtime NAS aliases (no rebuild needed for path changes) |
| `YOUTUBE_API_KEY` | `syncYouTubeStats` | YouTube Data API v3 key |
| `META_ACCESS_TOKEN` | `syncMetaStats` | Meta Graph API long-lived token |
| `TIKTOK_RAPIDAPI_HOST` | `syncTikTokStats` | RapidAPI host for TikTok provider |
| `TIKTOK_RAPIDAPI_KEY` | `syncTikTokStats` | RapidAPI key |
| `NEXTCLOUD_URL` | `src/lib/nextcloud.ts` | Base URL of Nextcloud instance |
| `NEXTCLOUD_USER` | `src/lib/nextcloud.ts` | Nextcloud username |
| `NEXTCLOUD_PASSWORD` | `src/lib/nextcloud.ts` | Nextcloud password |
| `NEXTCLOUD_BASE_PATH` | `src/lib/nextcloud.ts` | Active working directory for folder provisioning and draft scanning |
| `NEXTCLOUD_ARCHIVE_PATH` | `src/lib/nextcloud.ts` | Archive root used when completed folders move to `Done/<year>` |

Currency rates use the no-key ExchangeRate-API Open Access endpoint (`https://open.er-api.com/v6/latest/USD`). Do not add or document a fake exchange-rate secret unless the provider changes.

## 6. Architecture Conventions

- App pages are mostly Server Components that query Prisma directly, then pass data into client components.
- Mutations should usually live in `src/actions/*` as Server Actions.
- Legacy API routes exist under `src/app/api/*`; do not add new mutation flows there unless an API endpoint is specifically required.
- Use the Prisma singleton from `src/lib/prisma.ts`.
- Use the `@/*` import alias from `tsconfig.json`.
- Shared constants live in `src/lib/constants.ts`; do not duplicate stage, role, platform, content type, or format strings.
- Supported currencies and money formatting live in `src/lib/currency.ts`; exchange-rate fetching and cache freshness live in `src/lib/currencyRates.ts`.
- Locale-aware date formatting should use `toIntlLocale()` from `src/lib/i18n/locales.ts` instead of hardcoding `"en-US"` in pipeline-facing UI.
- Shared types live in `src/types/index.ts`. Keep these aligned with Prisma relation includes.
- All Server Actions return `ActionResult<T>`: `{ success: true; data: T } | { success: false; error: string }`.
- Client components that call Server Actions must update local React state, call `router.refresh()`, and/or rely on `revalidatePath` so SQLite changes are reflected without a hard refresh.

## 7. Routing and Access Control

Main routes:

- `/` redirects to `/setup` while the database has no users, otherwise to `/pipeline`.
- `/setup` creates the first `ADMIN` user and redirects to `/login` once any user exists.
- `/pipeline` shows non-archived projects on the Kanban board.
- `/archive` shows `Published` and `Scrapped` projects.
- `/analytics` shows platform-specific analytics totals for published projects.
- `/sponsorships` manages sponsorship CRM rows, multi-currency deal values, and linked project counts.
- `/team` manages users.
- `/settings` manages the current user's avatar, password, language, and preferred sponsorship currency.
- `/login` is the Credentials sign-in page.

Auth and RBAC:

- Roles are `ADMIN`, `MANAGER`, and `MEMBER` in `src/lib/roles.ts`.
- `src/middleware.ts` requires auth for app routes except API/static/login/setup paths, and rewrites public `/avatars/*` requests to `/api/avatars/*`.
- `MEMBER` users are blocked from `/analytics`, `/sponsorships`, and `/team`.
- The sidebar also hides those routes for `MEMBER`.
- NextAuth session fields are extended with `id`, `role`, `username`, and `avatarUrl`.

## 8. UI/UX and Tailwind System

The terminal aesthetic is a hard requirement.

- Backgrounds must be `#0a0a0a`, `#0f0f0f`, `bg-background`, `bg-black`, `bg-surface`, or related semantic tokens. Never hardcode these hex values in components — use the token.
- Borders should use `border-white/10`, `border-white/5`, `border-border`, or `border-border-visible`.
- Status and accent colors must use semantic tokens: `text-success`, `bg-warning`, `border-accent`, `bg-accent-subtle`, `text-error`, etc.
- Do not add raw Tailwind palette colors like `text-red-500`, `bg-emerald-500`, or `border-green-400`. If you find old violations while working nearby, fix them only when in scope.
- Destructive actions always map to `text-accent border-accent/40 hover:bg-accent-subtle`. Never `text-red-500`.
- Typography leans heavily on `font-mono`, `font-label`, `text-style-label`, uppercase labels, `tracking-widest`, and `text-[10px]`.
- Standard tabular/list page containers should use `h-full w-full overflow-auto p-lg` with a `mb-6` header block.
- Do not introduce `p-8` on new page containers. Normalize to `p-lg` when touching an affected page for a related reason.
- Forms and modals use sharp edges (`rounded-none` is default). `rounded-full` is reserved for avatars, indicator dots, and pill buttons only.
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

Stages are defined in `KANBAN_STAGES` in `src/lib/constants.ts`:

```
Ideation → Scripting, Filming
Scripting → Filming, Ideation
Filming → Editing, Scripting, Ideation
Editing → Review, Filming, Scripting
Review → Published, Editing
Published → (none — terminal state)
```

Transition rules are defined in `VALID_TRANSITIONS`. Do not hardcode a second source of truth.

Hard gate rules (enforced in `updateProjectStatus`):

| Transition | Gate |
|---|---|
| `Filming → Editing` | ALL items in `aRollShots` AND `bRollShots` must have `isCompleted: true`. Both arrays must be non-empty. |
| `Editing → Review` | `project.reviewLink` must be set (non-null). |
| `Review → Published` | Must go through `publishProject()` (not plain `updateProjectStatus`). `PublishModal` handles this flow. |
| `Review → Editing` (reject) | Captures `reviewFeedback`, clears `reviewLink`, increments `draftVersion`. |
| `Editing → Review` (resubmit) | Clears `reviewFeedback`. |

Additional pipeline rules:

- Pipeline pages exclude `Published` and `Scrapped` projects.
- Archive pages show `Published` and `Scrapped` projects.
- `Project.status` can also be `Scrapped` even though it is not in `KANBAN_STAGES`.
- Creating a project attempts to provision a matching Nextcloud folder in `NEXTCLOUD_BASE_PATH`.
- Sponsored project creation must link to an `Active` or `Pending` `Sponsorship` row through `Project.sponsorshipId`; do not restore the old free-text-only Sponsored flow.
- Draft scanning uses `Project.draftVersion` and looks only for the current `draft {version} - {project folder name}` prefix in Nextcloud. The scanner fills `reviewLink` and stays hidden while a link exists.
- Approval or publish should trigger Nextcloud archive movement when configured. File-system failures must be caught so the database transition still reports cleanly when possible.
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

Key Project fields:

| Field | Notes |
|---|---|
| `status` | Pipeline stage + `Scrapped` |
| `contentType` | `Organic \| Sponsored \| Product_Seeding` |
| `format` | `Short_Form \| Long_Form \| Static` |
| `platformsTargeted` | JSON string — `string[]` of platform names |
| `aRollShots` / `bRollShots` | JSON string — `ShotItem[]` |
| `abTitles` / `thumbnails` | JSON string — `string[]`, Long_Form only |
| `youtubeId` / `metaId` / `tiktokId` | External platform video IDs for API sync |
| `youtubeViews/Likes/Comments` | Per-platform counters — authoritative for totals |
| `metaViews/Likes/Comments` | Per-platform counters — authoritative for totals |
| `tiktokViews/Likes/Comments` | Per-platform counters — authoritative for totals |
| `views` / `likes` / `comments` | Legacy rollup fields — do not use for UI totals |
| `folderName` | NAS folder name — source of truth for local media location |
| `storagePath` | Legacy/secondary; prefer `folderName` + NAS env vars |
| `reviewLink` | Nextcloud share URL; required before entering Review stage |
| `draftVersion` | Starts at 1; incremented atomically on rejection |
| `sponsorshipId` | Links Sponsored projects to a `Sponsorship` row |
| `publishDate` / `publishedAt` | Both set by publish workflows to the selected publish date |
| `columnOrder` | Integer for ordering within a Kanban column |

Other schema notes:

- `Sponsorship.status` uses `Active`, `Pending`, `Completed`, `Cancelled`. Only `Active` and `Pending` deals can be linked when creating a Sponsored project.
- `Sponsorship.budget` stores the source deal amount; `Sponsorship.currency` stores its ISO currency code. Do not overwrite the source amount with a converted display value.
- `User.preferredCurrency` controls converted sponsorship totals for that account. Defaults to `VND`.
- `CurrencyRate` caches pair rates between supported currencies. Rates are fetched from USD-based upstream data and expanded into pair rates inside `src/lib/currencyRates.ts`.

## 12. Analytics and Platform Sync

- Manual and sync actions live mainly in `src/actions/projects.ts`.
- YouTube sync uses `YOUTUBE_API_KEY` and batches IDs in groups of 50.
- Meta sync uses `META_ACCESS_TOKEN` and Graph API fields for views, likes, and comments.
- TikTok sync uses `TIKTOK_RAPIDAPI_HOST` and `TIKTOK_RAPIDAPI_KEY`.
- Sync actions update platform-specific columns and revalidate `/analytics` and `/archive`.
- Archive and Analytics UI must compute totals from platform-specific columns (`youtubeViews + metaViews + tiktokViews`), not the legacy rollup fields.
- Top performer rows must render platform chips and per-platform metric strings conditionally from targeted/synced platforms.
- Short Form / Long Form badges derive from `platformsTargeted`, not from a global assumption.

## 12.1 Currency and Localization

- Sponsorship values are multi-currency. Preserve each deal's source `budget` and `currency`, then convert for display using the signed-in user's `preferredCurrency`.
- Preferred currency is changed from `/settings` via `src/app/settings/CurrencyPreferenceForm.tsx` and `src/actions/settings.ts`.
- Sponsorship summary totals, monthly totals, and deal rows should show converted preferred-currency amounts. If source and preferred currencies differ, also show the source amount for auditability.
- Exchange rates refresh on server startup and daily at `00:00` server time through `src/services/cron.ts`; `ensureFreshCurrencyRates()` also refreshes stale or incomplete caches when sponsorship pages load.
- The open access provider requires attribution. Keep the discreet "Rates By Exchange Rate API" link visible wherever cached rates are surfaced.
- Pipeline card deadline months and project modal date labels must follow the active app locale. Use `toIntlLocale(locale)` so Vietnamese users see Vietnamese month labels.

## 13. NAS and Nextcloud

- NAS path generation lives in `src/utils/nasPaths.ts`.
- Use `generateNasPaths(folderName, status, publishDate)` rather than building SMB paths inline.
- Generated paths use:
  - macOS: `smb://<host>/<share>/<root>/<subdir>/<folder>`
  - Windows: `\\<host>\<share>\<root>\<subdir>\<folder>`
- `Published` projects map to `Done/<year>`. Other active projects map to `Working`.
- Never hardcode NAS IPs or SMB roots in components.
- The active Nextcloud service lives in `src/lib/nextcloud.ts`; it owns WebDAV client creation, folder provisioning, draft scanning, internal file-link generation, and folder archiving.
- Project-facing Server Actions for Nextcloud behavior live in `src/actions/projects.ts`. Treat `src/actions/nextcloud.ts` as legacy unless a caller explicitly uses it.
- Draft detection must scale by version. It should use the dynamic prefix `draft ${draftVersion} - ${projectName}` case-insensitively, then choose the newest modified match when multiple files match that exact version.
- Nextcloud network calls must stay wrapped in `try/catch`; slow WebDAV scans, 404s, and archive move failures should be logged cleanly without crashing the Next.js server.

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
- Buttons and controls should use bracketed terminal copy where the surrounding UI does (e.g. `[ APPROVE ]`).
- Do not wrap page sections in decorative cards. Cards are for repeated items, modals, and actual framed tools.
- Avoid shadows, scaling hover animations, blur-heavy surfaces, and soft corporate UI patterns.
- Keep labels uppercase and compact.
- Use existing number/date helpers for display formatting. Do not hardcode `"en-US"` for user-facing dates in localized surfaces; use `toIntlLocale()`.

## 16. API Routes

Existing API routes:

- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/route.ts`
- `src/app/api/projects/[id]/move/route.ts`
- `src/app/api/projects/[id]/shotlist/route.ts`
- `src/app/api/analytics/route.ts`
- `src/app/api/users/route.ts`
- `src/app/api/avatars/[filename]/route.ts`
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
