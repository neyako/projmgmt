import type { Project, User, ShotlistItem, Analytics } from "@prisma/client";

export type ProjectUser = Pick<User, "id" | "name" | "role" | "avatarUrl">;

export type PublicUser = Pick<
  User,
  "id" | "name" | "email" | "username" | "role" | "avatarUrl"
>;

export type TeamUser = PublicUser & {
  hasLogin: boolean;
};

export type CredentialHandoff = {
  email: string;
  username: string;
  temporaryPassword: string;
  emailSubject: string;
  emailBody: string;
  emailDeliveryStatus: "pending_integration";
};

// ─── ENRICHED TYPES ─────────────────────────────────────
export type ProjectWithRelations = Project & {
  creator: ProjectUser;
  aRollAssignee: ProjectUser | null;
  bRollAssignee: ProjectUser | null;
  editingAssignee: ProjectUser | null;
  shotlistItems: ShotlistItem[];
  analytics: Analytics[];
};

export type ProjectCardData = Pick<
  ProjectWithRelations,
  | "id"
  | "title"
  | "contentType"
  | "format"
  | "status"
  | "platformsTargeted"
  | "columnOrder"
  | "aRollComplete"
  | "bRollComplete"
  | "storagePath"
  | "folderName"
  | "reviewLink"
  | "draftVersion"
  | "briefingNotes"
  | "script"
  | "reviewFeedback"
  | "creator"
  | "aRollAssignee"
  | "bRollAssignee"
  | "editingAssignee"
  | "shotlistItems"
> & {
  aRollShots?: string;
  bRollShots?: string;
  dueDate?: Date | string | null;
  scriptingDueDate?: Date | string | null;
  filmingDueDate?: Date | string | null;
  editingDueDate?: Date | string | null;
  assignedCameraman?: ProjectUser | null;
  assignedEditor?: ProjectUser | null;
  assignedTalent?: ProjectUser | null;
  assignedCameramanId?: string | null;
  assignedEditorId?: string | null;
  assignedTalentId?: string | null;

  // Ideation / planning metadata
  productLinks?: string | null;

  // Publishing checklist
  finalTitle?: string | null;
  hashtags?: string | null;
  publishedAt?: Date | string | null;
  publishDate?: Date | string | null;
  baseCaption?: string | null;
  abTitles?: string | null; // JSON-stringified string[]
  thumbnails?: string | null; // JSON-stringified string[]

  // Aggregate analytics rollup
  views?: number;
  likes?: number;
  comments?: number;

  // Platform references for external API sync
  youtubeId?: string | null;
  metaId?: string | null;
  tiktokId?: string | null;

  // Sponsorship linkage
  sponsorshipId?: string | null;
  sponsorship?: {
    id: string;
    brandName: string;
    contactEmail?: string | null;
    budget?: number;
    currency?: string | null;
    status: string;
    dueDate?: Date | string | null;
    notes?: string | null;
  } | null;
};

// Shot item shape for JSON fields
export interface ShotItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

// ─── API PAYLOADS ───────────────────────────────────────
export interface CreateProjectPayload {
  title: string;
  contentType: string;
  format: string;
  platformsTargeted: string[];
  briefingNotes?: string;
  productLinks?: string;
  sponsorshipId?: string;
  creatorId: string;
}

export interface MoveProjectPayload {
  targetStatus: string;
}

export interface UpdateProjectPayload {
  title?: string;
  contentType?: string;
  format?: string;
  status?: string;
  briefingNotes?: string;
  sponsorshipId?: string;
  platformsTargeted?: string;
  storagePath?: string;
  reviewLink?: string;
  aRollComplete?: boolean;
  bRollComplete?: boolean;
  aRollAssigneeId?: string;
  bRollAssigneeId?: string;
  editingAssigneeId?: string;
  publishDate?: string;
}

export interface CreateShotlistPayload {
  label: string;
  order?: number;
}

// ─── ANALYTICS ──────────────────────────────────────────
export interface AnalyticsSummary {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  viewsTrend: number; // percentage change
  likesTrend: number;
  commentsTrend: number;
  platformBreakdown: Record<string, number>;
}
