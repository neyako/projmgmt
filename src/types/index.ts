import type { Project, User, ShotlistItem, Analytics } from "@prisma/client";

// ─── ENRICHED TYPES ─────────────────────────────────────
export type ProjectWithRelations = Project & {
  creator: User;
  aRollAssignee: User | null;
  bRollAssignee: User | null;
  editingAssignee: User | null;
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
  | "reviewLink"
  | "briefingNotes"
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
  assignedCameraman?: { id: string; name: string; role: string } | null;
  assignedEditor?: { id: string; name: string; role: string } | null;
  assignedTalent?: { id: string; name: string; role: string } | null;
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
