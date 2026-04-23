# Studio_OS

A lightweight, self-hosted video production management dashboard built for a 6-person content team. 

## Features
* **Custom Kanban Pipeline:** Built with `@dnd-kit/core`, featuring split-state logic (A-Roll / B-Roll parallel tracking).
* **Terminal Aesthetic:** Strict dark-mode UI with monospace typography and high-contrast styling.
* **Hybrid Asset Management:** Tracks raw high-speed SMB network paths alongside Nextcloud delivery links.
* **Review Cycle:** Built-in feedback loops with automated status rejection and visual editor alerts.

## Tech Stack
* Next.js 15 (App Router)
* Prisma ORM (SQLite)
* Tailwind CSS

## Deployment (Proxmox LXC / Docker)
This application is designed to be lightweight and run within a self-hosted container environment.
1. Clone the repository into your LXC/VM.
2. Ensure your high-speed storage (e.g., TrueNAS) is mounted to the container if local API access is required in the future.
3. Run `npm install`.
4. Run `npx prisma db push` to initialize the SQLite database.
5. Run `npm run build` and start the production server with `npm start`.
