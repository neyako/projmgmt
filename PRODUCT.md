# Product

## Register

product

## Users

Primary users are producers, editors, managers, and small production-team members moving video projects through ideation, scripting, filming, editing, review, publishing, and archive. They work in a dense operational dashboard while coordinating deadlines, A-roll and B-roll shot readiness, review drafts, sponsorship context, platform IDs, analytics, Nextcloud folders, and NAS media paths.

The product is usually used as a control-room surface: a team member is scanning the pipeline on a desktop monitor, opening a project for a precise update, or checking a table before taking action. Speed, certainty, and visual continuity matter more than ornamental delight.

## Product Purpose

projmgmt is a self-hosted content production management dashboard for a small video team. It replaces generic project-management tooling with one opinionated workflow for pipeline state, storage discipline, review-version control, sponsor CRM data, publish metadata, role-based team access, and platform analytics.

Success means the team can see what is blocked, what is ready, who owns the next step, where assets live, which sponsor context applies, and what happened after publishing without leaving the dashboard or trusting loose status labels.

## Brand Personality

Sharp, mechanical, and production-focused.

The interface should feel like a high-contrast terminal instrument panel built for real work. Dark mode is the default control-room surface. Light mode should preserve the same semantic hierarchy as warm printed paper, not become a generic web app. Copy is compact, uppercase where functional, and direct.

## Anti-references

- Corporate cards, soft shadows, decorative gradients, glassmorphism, bouncy motion, and rounded default UI.
- Raw Tailwind palette colors that bypass semantic tokens.
- Smooth easing, spring physics, scale hovers, and animated layout properties.
- Marketing layouts, oversized hero composition, and decorative page choreography that slows task work.
- Free-text or duplicated workflow sources that drift from constants, Prisma shape, server actions, or the semantic Tailwind theme.

## Design Principles

- Preserve the terminal aesthetic over generic SaaS polish.
- Favor dense, scannable operational information over marketing composition.
- Route visual decisions through `DESIGN.md`, `src/app/globals.css`, and semantic Tailwind theme tokens.
- Keep interactions fast: server actions must reflect in local state, refreshes, or revalidation.
- Let workflow gates be visible and concrete: review links, shotlists, publish metadata, sponsorship links, role access, and platform metrics should explain themselves at the point of action.

## Accessibility & Inclusion

Maintain high contrast in dark and light modes, use semantic status tokens with non-color cues where possible, keep controls keyboard-reachable, and preserve focus visibility. Motion should be mechanical, short, state-driven, and respectful of reduced-motion preferences. Locale-aware dates and currency display are part of usability, not polish; use the existing i18n and currency helpers instead of hardcoded presentation.
