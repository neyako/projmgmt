# projmgmt Product Brief

register: product

## Product Purpose

projmgmt is a self-hosted content production management dashboard for a small video team. It keeps project pipeline state, sponsorship work, review drafts, publishing metadata, platform analytics, team roles, and storage paths in one operational tool.

## Users

Primary users are producers, editors, managers, and small production-team members moving video projects from ideation through scripting, filming, editing, review, and publish. They work inside a dense dashboard, often scanning deadlines, stage readiness, and asset links while coordinating Nextcloud/NAS workflows.

## Brand And Tone

The product reads like a high-contrast terminal instrument panel: sharp, monospaced, mechanical, compact, and production-focused. Dark mode is the default control-room surface. Light mode must preserve the same semantic hierarchy as warm printed paper, not become a generic web app.

## Strategic Principles

- Preserve the terminal aesthetic over generic SaaS polish.
- Favor dense, scannable operational information over marketing layouts.
- Use semantic theme tokens from `src/app/globals.css` and guidance from `DESIGN.md`.
- Keep motion mechanical, stepped, and purposeful. Motion should communicate load, state, or terminal presence.
- Keep app workflows fast: server actions must reflect in local UI state, refreshes, or revalidation.

## Anti-References

- Corporate cards, soft shadows, decorative gradients, glassmorphism, bouncy motion, and rounded default UI.
- Raw Tailwind palette colors that bypass semantic tokens.
- Smooth easing, spring physics, scale hovers, and animated layout properties.
- Decorative page choreography that slows task work.
