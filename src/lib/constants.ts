// ─── KANBAN STAGES ──────────────────────────────────────
export const KANBAN_STAGES = [
  "Ideation",
  "Scripting",
  "Filming",
  "Editing",
  "Review",
  "Published",
] as const;

export type KanbanStage = (typeof KANBAN_STAGES)[number];

// ─── ROLES ──────────────────────────────────────────────
export const ROLES = [
  "Talent",
  "Manager",
  "Cameraman",
  "Editor_Shorts",
  "Editor_FullStack",
] as const;

export type Role = (typeof ROLES)[number];

// ─── CONTENT TYPES ──────────────────────────────────────
export const CONTENT_TYPES = [
  "Organic",
  "Sponsored",
  "Product_Seeding",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

// ─── FORMATS ────────────────────────────────────────────
export const FORMATS = [
  "Short_Form",
  "Long_Form",
  "Static",
] as const;

export type Format = (typeof FORMATS)[number];

// ─── PLATFORMS ──────────────────────────────────────────
export const PLATFORMS = [
  "TikTok",
  "YT_Shorts",
  "YouTube",
  "Facebook",
] as const;

export type Platform = (typeof PLATFORMS)[number];

export const SHORT_FORM_PLATFORMS = [
  "Facebook",
  "YT_Shorts",
  "TikTok",
] as const satisfies readonly Platform[];

export const LONG_FORM_PLATFORMS = [
  "Facebook",
  "YouTube",
] as const satisfies readonly Platform[];

export function getPlatformsForFormat(format: string): readonly Platform[] {
  if (format === "Short_Form") return SHORT_FORM_PLATFORMS;
  if (format === "Long_Form") return LONG_FORM_PLATFORMS;
  return PLATFORMS;
}

// ─── COLUMN TRANSITION RULES ────────────────────────────
export const VALID_TRANSITIONS: Record<KanbanStage, KanbanStage[]> = {
  Ideation: ["Scripting", "Filming"],
  Scripting: ["Filming", "Ideation"],
  Filming: ["Editing", "Scripting", "Ideation"],
  Editing: ["Review", "Filming", "Scripting"],
  Review: ["Published", "Editing"],
  Published: [],
};

// ─── NAV ITEMS ──────────────────────────────────────────
// `i18nKey` resolves via dictionary at render time. `label` is the English fallback.
export const NAV_ITEMS = [
  { i18nKey: "nav.pipeline", label: "PIPELINE", icon: "view_kanban", href: "/pipeline" },
  { i18nKey: "nav.archive", label: "ARCHIVE", icon: "inventory_2", href: "/archive" },
  { i18nKey: "nav.analytics", label: "ANALYTICS", icon: "insert_chart", href: "/analytics" },
  { i18nKey: "nav.sponsorships", label: "SPONSORSHIPS", icon: "handshake", href: "/sponsorships" },
  { i18nKey: "nav.team", label: "TEAM", icon: "group", href: "/team" },
] as const;

export const NAV_FOOTER_ITEMS = [] as const;
