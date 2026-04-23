# Studio_OS

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-ORM-1B222D?style=flat-square&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)

A lightweight, highly customized, self-hosted video production management dashboard built specifically for a 6-person content team. 

## The Problem It Solves
Off-the-shelf project management tools (like Notion or Trello) are either too generic, too rigid, or too slow for high-bandwidth video teams. Studio_OS replaces bloated SaaS trackers with a hyper-focused, local-first solution tailored to the realities of multi-terabyte SMB network paths, Nextcloud review loops, and parallel filming schedules.

## Deep-Dive Features

* **Split-State Kanban:** The pipeline features advanced column transition logic. The `Filming` stage enforces parallel A-Roll and B-Roll tracking. A project cannot progress to `Editing` until 100% of the JSON-driven shotlist items are marked complete by the cameramen.
* **Hybrid Asset Tracking:** Bridges the gap between local infrastructure and external delivery. Tracks raw high-speed 10Gbps NAS paths (`\\truenas\projects\...`) alongside external Nextcloud review links, ensuring editors and managers always know exactly where the multi-terabyte source files live.
* **Review Pipeline:** Built-in feedback loops. When a manager rejects a cut, the project automatically returns to `Editing`, visually flagging the card with a red glow and injecting the revision notes directly into the editor's Kanban view. Feedback is automatically cleared upon resubmission.
* **Archive & Analytics:** Published projects automatically move off the board and into a tabular Archive view, providing a high-density, terminal-styled ledger of completed work and performance analytics (Views, Likes, Comments).

## Team Roles (RBAC Prep)
The system architecture supports a 6-person team structure:
* **Manager:** Oversees the pipeline, defines briefing notes, and approves/rejects final cuts.
* **Talent:** The on-camera personality assigned to specific A-Roll tasks.
* **Cameraman:** Responsible for executing the JSON-based A-Roll and B-Roll shotlists.
* **Editor (Shorts):** Auto-assigned to `Short_Form` projects entering the Editing stage.
* **Editor (Full-Stack):** Auto-assigned to `Long_Form` projects entering the Editing stage.

## Tech Stack
* **Framework:** Next.js 15 (App Router, Server Actions)
* **Database:** Prisma ORM with SQLite (local file database)
* **Styling:** Tailwind CSS (strict dark mode/terminal aesthetic)
* **Drag-and-Drop:** `@dnd-kit/core` with custom pointer sensors and transition gating.

## Deployment Guide (Proxmox LXC / Docker)
This application is designed to run bare-metal or inside a self-hosted container environment with direct access to local network storage.

1. **Clone the repository** into your LXC/VM.
2. **Mount Storage:** Ensure your high-speed NAS storage (e.g., TrueNAS SMB share) is mounted to the container if direct local file API access is required in future updates.
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Initialize Database:**
   ```bash
   npx prisma db push
   npm run db:seed
   ```
5. **Build & Serve:**
   ```bash
   npm run build
   npm start
   ```
