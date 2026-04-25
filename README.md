# projmgmt

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-ORM-1B222D?style=flat-square&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)

Self-hosted production management for a small video team: pipeline tracking, filming shotlists, review loops, sponsorships, archive, analytics, and NAS-aware asset paths in a strict terminal-inspired UI.

## Setup First

This app is designed for a local or self-hosted environment with SQLite and optional access to NAS, Nextcloud, and platform analytics APIs.

### 1. Prerequisites

- Node.js 20 or newer is recommended.
- npm, included with Node.js.
- A local `.env` file.

### 2. Install

```bash
git clone https://github.com/neyako/projmgmt.git
cd projmgmt
npm install
```

`npm install` also runs `prisma generate` through the `postinstall` script.

### 3. Configure `.env`

Create `.env` in the project root:

```bash
DATABASE_URL="file:./dev.db"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-generated-secret"

NEXT_PUBLIC_NAS_IP="192.168.1.10"
NEXT_PUBLIC_NAS_SHARE="projects"
NEXT_PUBLIC_NAS_ROOT_DIR="Studio"
```

Generate a local auth secret with:

```bash
openssl rand -base64 32
```

Optional integration variables:

```bash
YOUTUBE_API_KEY=""
META_ACCESS_TOKEN=""
TIKTOK_RAPIDAPI_HOST=""
TIKTOK_RAPIDAPI_KEY=""

NEXTCLOUD_URL=""
NEXTCLOUD_USER=""
NEXTCLOUD_PASSWORD=""
```

### 4. Initialize SQLite

```bash
npm run db:push
```

To load sample production data:

```bash
npm run db:seed
```

`npm run db:seed` is destructive. It clears existing users, projects, shotlist items, and analytics before inserting demo data.

### 5. Create A Local Admin Login

The seed script creates demo people and projects, but it does not create username/password credentials. Run this after `db:push` or after `db:seed`:

```bash
npx tsx -e '
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("change-me-now", 12);

  await prisma.user.upsert({
    where: { email: "admin@projmgmt.local" },
    update: { username: "admin", passwordHash, role: "ADMIN" },
    create: {
      name: "Local Admin",
      email: "admin@projmgmt.local",
      username: "admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Login: admin / change-me-now");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
'
```

Sign in with `admin` / `change-me-now`, then change the password from `/settings`.

### 6. Run The App

```bash
npm run dev
```

Open `http://localhost:3000`. Authenticated users land on `/pipeline`.

### 7. Verify A Local Build

```bash
npm run build
```

There are currently no configured `lint` or `test` scripts.

## Daily Development

Useful commands:

```bash
npm run dev       # Next.js dev server with Turbopack
npm run build     # production build verification
npm run start     # run the built app
npm run db:push   # push Prisma schema to SQLite
npm run db:seed   # destructive sample data reset
npm run db:studio # inspect/edit SQLite data
```

Main local paths:

- `src/app/` - App Router pages, layouts, API routes, global CSS, and app-level actions.
- `src/actions/` - Primary Server Actions for database mutations.
- `src/components/` - Layout, Kanban, modal, table, analytics, sponsorship, team, and UI components.
- `src/lib/` - Auth, roles, Prisma client, constants, and helpers.
- `src/services/` - Cron and external analytics service helpers.
- `src/types/` - Shared types layered on Prisma models.
- `src/utils/nasPaths.ts` - OS-aware SMB path generation.
- `prisma/schema.prisma` - SQLite schema.
- `prisma/seed.ts` - Destructive demo data seed.
- `DESIGN.md` - Visual source of truth.
- `AGENTS.md` - AI assistant and contributor guardrails.

## Product Overview

projmgmt replaces generic project management tools with a focused workflow for high-bandwidth content teams. It is built around local storage paths, Nextcloud review links, split A-Roll/B-Roll filming checklists, and platform-specific performance tracking.

Core areas:

- **Pipeline:** A drag-and-drop Kanban board for `Ideation`, `Scripting`, `Filming`, `Editing`, and `Review`.
- **Publishing checklist:** Moving to `Published` opens a final metadata modal before the card leaves the board.
- **Archive:** Published and scrapped projects live outside the active pipeline.
- **Analytics:** YouTube, Meta, and TikTok metrics are synced and displayed as per-platform totals.
- **Sponsorships:** Brand deal CRM tied to the production workflow.
- **Team:** User roster and role management.
- **Settings:** Current user avatar upload and password change.

## Workflow Rules

- `Filming -> Editing` requires all parsed `aRollShots` and `bRollShots` to be complete.
- `Editing -> Review` requires a Nextcloud review link.
- Review rejection returns the project to `Editing` and stores feedback on the card.
- Published projects move out of `/pipeline` and into `/archive`.
- Archive and Analytics totals must be computed from platform-specific columns:
  - `youtubeViews`, `metaViews`, `tiktokViews`
  - `youtubeLikes`, `metaLikes`, `tiktokLikes`
  - `youtubeComments`, `metaComments`, `tiktokComments`

## Roles

- `ADMIN` - Full access.
- `MANAGER` - Full operational access.
- `MEMBER` - Limited access. Members are blocked from `/analytics`, `/sponsorships`, and `/team`.

## Design Contract

The UI is intentionally terminal-inspired and high contrast. Preserve it.

- Use semantic Tailwind theme tokens from `src/app/globals.css`.
- Follow `DESIGN.md`.
- Do not introduce generic rounded corporate UI.
- Do not add raw Tailwind palette colors such as `red-500`, `green-400`, or `emerald-500`.
- Standard list/table pages should use `h-full w-full overflow-auto p-lg`.
- Keep visible controls sharp, uppercase, compact, and mono-heavy.

## Data Notes

Several fields are JSON strings in SQLite and must be parsed/stringified by the UI and Server Actions:

- `platformsTargeted`
- `aRollShots`
- `bRollShots`
- `abTitles`
- `thumbnails`

`folderName` is the source of truth for local media location. RAW paths are generated from `NEXT_PUBLIC_NAS_IP`, `NEXT_PUBLIC_NAS_SHARE`, and `NEXT_PUBLIC_NAS_ROOT_DIR`; do not hardcode SMB roots in components.

## License

MIT. See [LICENSE](LICENSE).
