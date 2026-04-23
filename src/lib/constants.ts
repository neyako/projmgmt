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
  "Instagram",
  "Meta",
] as const;

export type Platform = (typeof PLATFORMS)[number];

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
export const NAV_ITEMS = [
  { label: "PIPELINE", icon: "view_kanban", href: "/pipeline" },
  { label: "ARCHIVE", icon: "inventory_2", href: "/archive" },
  { label: "ANALYTICS", icon: "insert_chart", href: "/analytics" },
  { label: "SPONSORSHIPS", icon: "handshake", href: "/sponsorships" },
  { label: "TEAM", icon: "group", href: "/team" },
] as const;

export const NAV_FOOTER_ITEMS = [
  { label: "SETTINGS", icon: "settings", href: "/settings" },
] as const;
