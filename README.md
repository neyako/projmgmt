# projmgmt

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-ORM-1B222D?style=flat-square&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)

A lightweight, highly customized, self-hosted production management dashboard built for a small content team. Features a strict terminal aesthetic built on the Nothing design philosophy.

## The Problem It Solves
Off-the-shelf project management tools (like Notion or Trello) are either too generic, too rigid, or too slow for high-bandwidth video teams. projmgmt replaces bloated SaaS trackers with a hyper-focused, local-first solution tailored to the realities of multi-terabyte SMB network paths, Nextcloud review loops, and parallel filming schedules.

## Deep-Dive Features

* **Split-State Kanban:** The pipeline features advanced column transition logic. The `Filming` stage enforces parallel A-Roll and B-Roll tracking. A project cannot progress to `Editing` until 100% of the JSON-driven shotlist items are marked complete.
* **Hybrid Asset Tracking:** Bridges local infrastructure and external delivery. Editors set a project `folderName` once in the RAW asset row; projmgmt generates OS-aware NAS paths for SMB (`smb://...` on macOS, `\\server\share\...` on Windows) from `NEXT_PUBLIC_NAS_IP`, `NEXT_PUBLIC_NAS_SHARE`, and `NEXT_PUBLIC_NAS_ROOT_DIR`. Nextcloud review links remain beside the RAW path.
* **Review Pipeline:** Built-in feedback loops. When a manager rejects a cut, the project automatically returns to `Editing`, visually flagging the card with revision notes directly in the workflow. Feedback is automatically cleared upon resubmission.
* **Archive & Analytics:** Published projects automatically move off the board and into a tabular Archive view. Scrapped projects are retained. Views, Likes, and Comments are displayed as platform grand totals by summing YouTube, Meta, and TikTok metrics (`youtube* + meta* + tiktok*`) with locale-formatted numbers. Analytics performer rows only render platform chips and per-platform metrics for platforms actually targeted or synced, and they classify each video as Short Form / Long Form from `platformsTargeted`.
* **Sponsorship CRM:** Integrated tracking pipeline for brand deals tied to the main production schedule.
* **Team Roster & RBAC:** Supports `ADMIN`, `MANAGER`, and `MEMBER` access tiers for auth and route protection.

## Access Roles
The app currently uses a 3-tier RBAC model:
* **ADMIN:** Full access.
* **MANAGER:** Full operational access.
* **MEMBER:** Limited access for editors/crew; restricted from protected management pages.

## Tech Stack
* **Framework:** Next.js 15 (App Router, Server Actions)
* **Database:** Prisma ORM with SQLite (local file database)
* **Styling:** Tailwind CSS v4 with semantic theme tokens for dark/light Nothing-inspired UI
* **Auth:** NextAuth.js v4 with Credentials provider + Prisma adapter
* **Drag-and-Drop:** `@dnd-kit/core` with custom pointer sensors and transition gating.

## Quickstart Tutorial (Local Setup)

This application is designed to run bare-metal or inside a self-hosted container environment with direct access to local network storage.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/neyako/projmgmt.git
   cd projmgmt
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure NAS Environment Variables (.env):**
   ```bash
   NEXT_PUBLIC_NAS_IP=192.168.1.10
   NEXT_PUBLIC_NAS_SHARE=projects
   NEXT_PUBLIC_NAS_ROOT_DIR=Studio
   ```

4. **Initialize Database:**
   This pushes Prisma schema to local SQLite (`prisma/dev.db`) and seeds sample users/projects.
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```

6. **Access projmgmt:**
   Open `http://localhost:3000` in your browser. You will be redirected to the `/pipeline` board.

## License

MIT License

Copyright (c) 2026 Neyako Pham

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
