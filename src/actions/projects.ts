"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { VALID_TRANSITIONS, type KanbanStage } from "@/lib/constants";

// ─── RESULT TYPE ────────────────────────────────────────
type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

function parseShotItemsJSON(
  json: string | null | undefined
): { id: string; text: string; isCompleted: boolean }[] {
  try {
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

// ─── CREATE PROJECT ─────────────────────────────────────
export async function createProject(formData: {
  title: string;
  contentType: string;
  format: string;
  platformsTargeted: string[];
  briefingNotes?: string;
  creatorId?: string;
}): Promise<ActionResult> {
  if (!formData.title?.trim()) {
    return { success: false, error: "Title is required." };
  }

  if (formData.contentType === "Sponsored" && !formData.briefingNotes?.trim()) {
    return { success: false, error: "Sponsored projects require Briefing Notes." };
  }

  // Auto-resolve creator: use provided ID, or default to first user
  let creatorId = formData.creatorId;
  if (!creatorId) {
    const defaultUser = await prisma.user.findFirst({ orderBy: { name: "asc" } });
    if (!defaultUser) {
      return { success: false, error: "No default user found." };
    }
    creatorId = defaultUser.id;
  }

  try {
    // Get max columnOrder in Ideation to place card at end
    const maxOrder = await prisma.project.aggregate({
      where: { status: "Ideation" },
      _max: { columnOrder: true },
    });

    const project = await prisma.project.create({
      data: {
        title: formData.title.trim(),
        contentType: formData.contentType,
        format: formData.format,
        platformsTargeted: JSON.stringify(formData.platformsTargeted),
        briefingNotes: formData.briefingNotes || null,
        creatorId: creatorId,
        status: "Ideation",
        columnOrder: (maxOrder._max.columnOrder ?? -1) + 1,
      },
    });

    revalidatePath("/pipeline");
    return { success: true, data: project };
  } catch (err) {
    console.error("[createProject]", err);
    return { success: false, error: "Failed to create project." };
  }
}

// ─── UPDATE PROJECT STATUS (Kanban Move) ────────────────
export async function updateProjectStatus(
  projectId: string,
  targetStatus: string,
  feedback?: string
): Promise<ActionResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { aRollAssignee: true, bRollAssignee: true },
  });

  if (!project) {
    return { success: false, error: "Project not found." };
  }

  const from = project.status as KanbanStage;
  const to = targetStatus as KanbanStage;

  // ─── TRANSITION VALIDATION ──────────────────────────
  if (!VALID_TRANSITIONS[from]?.includes(to)) {
    return { success: false, error: `Cannot move from ${from} to ${to}.` };
  }

  if (from === "Ideation" && to === "Scripting") {
    if (!project.title || !project.contentType) {
      return { success: false, error: "Title and Content Type are required before Scripting." };
    }
  }

  // *** CRUCIAL: Filming → Editing gate ***
  if (from === "Filming" && to === "Editing") {
    const aShots = parseShotItemsJSON(project.aRollShots);
    const bShots = parseShotItemsJSON(project.bRollShots);
    const aReady = aShots.length > 0 && aShots.every((s) => s.isCompleted);
    const bReady = bShots.length > 0 && bShots.every((s) => s.isCompleted);
    if (!aReady || !bReady) {
      return {
        success: false,
        error: "All A-Roll and B-Roll shots must be completed before moving to Editing.",
      };
    }
  }

  if (from === "Editing" && to === "Review") {
    if (!project.reviewLink) {
      return { success: false, error: "A Nextcloud Review Link is required before Review." };
    }
  }

  try {
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: to,
        ...(to === "Published" && { publishDate: new Date() }),
        ...(from === "Review" && to === "Editing" && {
          reviewFeedback: feedback?.trim() || null,
        }),
        ...(from === "Editing" && to === "Review" && {
          reviewFeedback: null, // Clear feedback on resubmit
        }),
      },
    });

    revalidatePath("/pipeline");
    revalidatePath("/archive");
    return { success: true, data: updated };
  } catch (err) {
    console.error("[updateProjectStatus]", err);
    return { success: false, error: "Failed to update project status." };
  }
}

// ─── DIRECT PROJECT PANEL UPDATES ───────────────────────
export async function updateProjectStatusDirect(
  projectId: string,
  newStatus: string
): Promise<ActionResult> {
  try {
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: newStatus,
        ...(newStatus === "Published" && { publishDate: new Date() }),
      },
    });
    revalidatePath("/pipeline");
    revalidatePath("/archive");
    return { success: true, data: updated };
  } catch (err) {
    console.error("[updateProjectStatusDirect]", err);
    return { success: false, error: "Failed to update project status." };
  }
}

export async function toggleProjectPlatform(
  projectId: string,
  platform: string
): Promise<ActionResult<string[]>> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { platformsTargeted: true },
    });
    if (!project) {
      return { success: false, error: "Project not found." };
    }

    let current: string[] = [];
    try {
      const parsed = JSON.parse(project.platformsTargeted || "[]");
      current = Array.isArray(parsed) ? parsed.filter((p) => typeof p === "string") : [];
    } catch {
      current = [];
    }

    const next = current.includes(platform)
      ? current.filter((p) => p !== platform)
      : [...current, platform];

    await prisma.project.update({
      where: { id: projectId },
      data: { platformsTargeted: JSON.stringify(next) },
    });
    revalidatePath("/pipeline");
    revalidatePath("/archive");
    return { success: true, data: next };
  } catch (err) {
    console.error("[toggleProjectPlatform]", err);
    return { success: false, error: "Failed to update project platforms." };
  }
}

// ─── TOGGLE A-ROLL COMPLETE ─────────────────────────────
export async function toggleARoll(
  projectId: string,
  complete: boolean
): Promise<ActionResult> {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { aRollComplete: complete },
    });
    revalidatePath("/pipeline");
    return { success: true, data: null };
  } catch (err) {
    console.error("[toggleARoll]", err);
    return { success: false, error: "Failed to toggle A-Roll." };
  }
}

// ─── TOGGLE SHOTLIST ITEM (B-Roll) ──────────────────────
export async function toggleShotlistItem(
  projectId: string,
  itemId: string,
  completed: boolean
): Promise<ActionResult> {
  try {
    await prisma.shotlistItem.update({
      where: { id: itemId },
      data: { completed },
    });

    // Check if ALL shotlist items are complete → auto-update bRollComplete
    const allItems = await prisma.shotlistItem.findMany({
      where: { projectId },
    });
    const allComplete =
      allItems.length > 0 && allItems.every((i) => i.completed);

    await prisma.project.update({
      where: { id: projectId },
      data: { bRollComplete: allComplete },
    });

    revalidatePath("/pipeline");
    return { success: true, data: { allComplete } };
  } catch (err) {
    console.error("[toggleShotlistItem]", err);
    return { success: false, error: "Failed to toggle shotlist item." };
  }
}

// ─── GET ALL USERS (for forms) ──────────────────────────
export async function getUsers() {
  return prisma.user.findMany({ orderBy: { name: "asc" } });
}

// ─── UPDATE PROJECT METADATA (Due Date + Assignees + Product Links) ─────
export async function updateProjectMetadata(
  projectId: string,
  data: {
    dueDate?: string | null;
    assignedEditorId?: string | null;
    assignedCameramanId?: string | null;
    assignedTalentId?: string | null;
    productLinks?: string | null;
  }
): Promise<ActionResult> {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.assignedEditorId !== undefined && {
          assignedEditorId: data.assignedEditorId || null,
        }),
        ...(data.assignedCameramanId !== undefined && {
          assignedCameramanId: data.assignedCameramanId || null,
        }),
        ...(data.assignedTalentId !== undefined && {
          assignedTalentId: data.assignedTalentId || null,
        }),
        ...(data.productLinks !== undefined && {
          productLinks: data.productLinks?.trim() || null,
        }),
      },
    });
    revalidatePath("/pipeline");
    return { success: true, data: null };
  } catch (err) {
    console.error("[updateProjectMetadata]", err);
    return { success: false, error: "Failed to update metadata." };
  }
}

// ─── UPDATE PROJECT ASSETS (Storage Path + Review Link) ─
export async function updateProjectAssets(
  projectId: string,
  data: { storagePath?: string | null; reviewLink?: string | null }
): Promise<ActionResult> {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.storagePath !== undefined && {
          storagePath: data.storagePath || null,
        }),
        ...(data.reviewLink !== undefined && {
          reviewLink: data.reviewLink || null,
        }),
      },
    });
    revalidatePath("/pipeline");
    return { success: true, data: null };
  } catch (err) {
    console.error("[updateProjectAssets]", err);
    return { success: false, error: "Failed to update assets." };
  }
}

// ─── SUBMIT REVIEW (Approve / Reject with feedback) ─────
export async function submitReview(
  projectId: string,
  action: "approve" | "reject",
  feedback?: string
): Promise<ActionResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) {
    return { success: false, error: "Project not found." };
  }
  if (project.status !== "Review") {
    return { success: false, error: "Project is not in Review." };
  }

  try {
    const updated = await prisma.project.update({
      where: { id: projectId },
      data:
        action === "approve"
          ? { status: "Published", publishDate: new Date() }
          : { status: "Editing", reviewFeedback: feedback?.trim() || null },
    });
    revalidatePath("/pipeline");
    revalidatePath("/archive");
    return { success: true, data: updated };
  } catch (err) {
    console.error("[submitReview]", err);
    return { success: false, error: "Failed to submit review." };
  }
}

// ─── ARCHIVE PROJECT (Skip transition rules) ───────────
export async function archiveProject(projectId: string): Promise<ActionResult> {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "Scrapped" },
    });
    revalidatePath("/pipeline");
    revalidatePath("/archive");
    return { success: true, data: null };
  } catch (err) {
    console.error("[archiveProject]", err);
    return { success: false, error: "Failed to archive project." };
  }
}

// ─── DELETE PROJECT ─────────────────────────────────────
export async function deleteProject(projectId: string): Promise<ActionResult> {
  try {
    await prisma.project.delete({ where: { id: projectId } });
    revalidatePath("/pipeline");
    revalidatePath("/archive");
    return { success: true, data: null };
  } catch (err) {
    console.error("[deleteProject]", err);
    return { success: false, error: "Failed to delete project." };
  }
}

export async function restoreProjectToPipeline(projectId: string): Promise<ActionResult> {
  try {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "Ideation",
        reviewFeedback: null,
        publishDate: null,
      },
    });
    revalidatePath("/pipeline");
    revalidatePath("/archive");
    return { success: true, data: project };
  } catch (err) {
    console.error("[restoreProjectToPipeline]", err);
    return { success: false, error: "Failed to restore project." };
  }
}

// ─── PUBLISH PROJECT (Checklist intercept) ──────────────
export async function publishProject(
  projectId: string,
  data: {
    finalTitle: string;
    publishedAt?: string | null;
    youtubeId?: string;
    metaId?: string;
    tiktokId?: string;
    // Short-Form
    baseCaption?: string;
    hashtags?: string;
    // Long-Form
    abTitles?: string[];
    thumbnails?: string[];
  }
): Promise<ActionResult> {
  if (!data.finalTitle?.trim()) {
    return { success: false, error: "Final video title is required." };
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { success: false, error: "Project not found." };

  const resolvedPublishedAt = data.publishedAt ? new Date(data.publishedAt) : new Date();

  const isShort = project.format === "Short_Form";
  const isLong = project.format === "Long_Form";

  // Normalize arrays: keep trimmed non-empty entries, JSON-stringify.
  const cleanedAbTitles = (data.abTitles ?? [])
    .map((t) => t?.trim() ?? "")
    .filter(Boolean);
  const cleanedThumbnails = (data.thumbnails ?? [])
    .map((t) => t?.trim() ?? "")
    .filter(Boolean);

  const cleanedYoutubeId = data.youtubeId?.trim() || null;
  const cleanedMetaId = data.metaId?.trim() || null;
  const cleanedTiktokId = data.tiktokId?.trim() || null;

  try {
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "Published",
        finalTitle: data.finalTitle.trim(),
        publishedAt: resolvedPublishedAt,
        publishDate: resolvedPublishedAt,
        reviewFeedback: null,
        youtubeId: cleanedYoutubeId,
        metaId: cleanedMetaId,
        tiktokId: cleanedTiktokId,
        // Short-Form only
        baseCaption: isShort ? data.baseCaption?.trim() || null : null,
        hashtags: isShort ? data.hashtags?.trim() || null : null,
        // Long-Form only
        abTitles: isLong && cleanedAbTitles.length
          ? JSON.stringify(cleanedAbTitles)
          : null,
        thumbnails: isLong && cleanedThumbnails.length
          ? JSON.stringify(cleanedThumbnails)
          : null,
      },
    });
    revalidatePath("/pipeline");
    revalidatePath("/archive");
    revalidatePath("/analytics");
    return { success: true, data: updated };
  } catch (err) {
    console.error("[publishProject]", err);
    return { success: false, error: "Failed to publish project." };
  }
}

// ─── SYNC YOUTUBE STATS (Bulk API pull) ─────────────────
type YouTubeApiItem = {
  id: string;
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
};

type YouTubeApiResponse = { items?: YouTubeApiItem[] };

function parseCount(raw: unknown): number {
  if (raw === null || raw === undefined) return 0;
  const n =
    typeof raw === "number" ? Math.floor(raw) : parseInt(String(raw), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function syncYouTubeStats(): Promise<
  ActionResult<{ updated: number; total: number }>
> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return { success: false, error: "YOUTUBE_API_KEY env var missing." };
  }

  const projects = await prisma.project.findMany({
    where: {
      status: "Published",
      youtubeId: { not: null },
    },
    select: { id: true, youtubeId: true },
  });

  if (projects.length === 0) {
    return { success: true, data: { updated: 0, total: 0 } };
  }

  // YouTube Data API v3 allows up to 50 ids per call.
  const idGroups = chunk(
    projects.map((p) => p.youtubeId!).filter(Boolean),
    50
  );

  const statsById = new Map<
    string,
    { views: number; likes: number; comments: number }
  >();

  try {
    for (const group of idGroups) {
      const joined = group.join(",");
      const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(
        joined
      )}&key=${apiKey}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(
          "[syncYouTubeStats] YouTube API error",
          res.status,
          errText
        );
        return {
          success: false,
          error: `YouTube API responded ${res.status}.`,
        };
      }
      const json = (await res.json()) as YouTubeApiResponse;
      for (const item of json.items ?? []) {
        statsById.set(item.id, {
          views: parseCount(item.statistics?.viewCount),
          likes: parseCount(item.statistics?.likeCount),
          comments: parseCount(item.statistics?.commentCount),
        });
      }
    }
  } catch (err) {
    console.error("[syncYouTubeStats] fetch failed", err);
    return { success: false, error: "Failed to reach YouTube API." };
  }

  const writes = projects
    .filter((p) => p.youtubeId && statsById.has(p.youtubeId))
    .map((p) => {
      const s = statsById.get(p.youtubeId!)!;
      return prisma.project.update({
        where: { id: p.id },
        data: {
          youtubeViews: s.views,
          youtubeLikes: s.likes,
          youtubeComments: s.comments,
        },
      });
    });

  try {
    if (writes.length > 0) await prisma.$transaction(writes);
    revalidatePath("/analytics");
    revalidatePath("/archive");
    return {
      success: true,
      data: { updated: writes.length, total: projects.length },
    };
  } catch (err) {
    console.error("[syncYouTubeStats] db update failed", err);
    return { success: false, error: "Failed to persist stats." };
  }
}

// ─── SYNC META STATS (Instagram / Facebook Reels) ───────
export async function syncMetaStats(): Promise<
  ActionResult<{ updated: number; total: number }>
> {
  console.log("[META SYNC] 1. Action triggered.");

  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    return { success: false, error: "META_ACCESS_TOKEN env var missing." };
  }

  const projects = await prisma.project.findMany({
    where: {
      status: "Published",
      metaId: { not: null },
    },
    select: { id: true, metaId: true },
  });

  console.log("[META SYNC] 2. Prisma found projects:", projects.length);
  console.log(
    "[META SYNC] Project Data:",
    projects.map((p) => ({ id: p.id, metaId: p.metaId }))
  );

  if (projects.length === 0) {
    return { success: true, data: { updated: 0, total: 0 } };
  }

  let updated = 0;

  for (const project of projects) {
    if (!project.metaId) continue;
    try {
      console.log("[META SYNC] 3. Fetching Meta ID:", project.metaId);
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${project.metaId}?fields=views,likes.summary(total_count),comments.summary(total_count)&access_token=${process.env.META_ACCESS_TOKEN}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      console.log("=== FB RAW DATA ===", JSON.stringify(data, null, 2));

      if (data?.error) {
        console.error(
          "[syncMetaStats] Graph API error",
          project.metaId,
          data.error
        );
        continue;
      }

      const views = parseInt(data?.views || 0, 10);
      const likes = parseInt(data?.likes?.summary?.total_count || 0, 10);
      const comments = parseInt(data?.comments?.summary?.total_count || 0, 10);

      await prisma.project.update({
        where: { id: project.id },
        data: {
          metaViews: views,
          metaLikes: likes,
          metaComments: comments,
        },
      });
      updated += 1;
    } catch (error) {
      console.error("[META SYNC] ❌ ERROR CAUGHT:", error);
      console.error("[syncMetaStats] fetch/update failed", project.id, error);
      // Swallow per-project errors so a single bad ID doesn't abort the batch.
      continue;
    }
  }

  revalidatePath("/analytics");
  revalidatePath("/archive");

  return {
    success: true,
    data: { updated, total: projects.length },
  };
}

// ─── SYNC TIKTOK STATS (RapidAPI scraper) ───────────────
export async function syncTikTokStats(): Promise<
  ActionResult<{ updated: number; total: number }>
> {
  const rapidHost = process.env.TIKTOK_RAPIDAPI_HOST;
  const rapidKey = process.env.TIKTOK_RAPIDAPI_KEY;
  if (!rapidHost || !rapidKey) {
    return {
      success: false,
      error: "TIKTOK_RAPIDAPI_HOST / TIKTOK_RAPIDAPI_KEY env vars missing.",
    };
  }

  const projects = await prisma.project.findMany({
    where: {
      status: "Published",
      tiktokId: { not: null },
    },
    select: { id: true, tiktokId: true },
  });

  if (projects.length === 0) {
    return { success: true, data: { updated: 0, total: 0 } };
  }

  let updated = 0;

  for (const project of projects) {
    if (!project.tiktokId) continue;
    try {
      // tiktok-api23.p.rapidapi.com uses `/api/post/detail?videoId=...`.
      // If switching RapidAPI providers, adjust the path/param name here.
      const res = await fetch(
        `https://${rapidHost}/api/post/detail?videoId=${encodeURIComponent(
          project.tiktokId
        )}`,
        {
          headers: {
            "x-rapidapi-host": rapidHost,
            "x-rapidapi-key": rapidKey,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );
      const data = await res.json();

      if (data?.error || data?.message === "error") {
        console.error(
          "[syncTikTokStats] API error",
          project.tiktokId,
          data?.error ?? data?.message
        );
        continue;
      }

      // tiktok-api23 nests stats under `itemInfo.itemStruct.stats` (numbers)
      // with a string-valued mirror at `itemInfo.itemStruct.statsV2`.
      // Fall back through other providers' shapes just in case.
      const itemStruct = data?.itemInfo?.itemStruct;
      const apiStats =
        itemStruct?.stats ||
        itemStruct?.statsV2 ||
        data?.stats ||
        data?.data?.stats ||
        data?.aweme_detail?.stats ||
        {};

      // parseInt handles both number and string forms (statsV2 is stringified).
      const views = parseInt(apiStats.playCount || 0, 10);
      const likes = parseInt(apiStats.diggCount || 0, 10);
      const comments = parseInt(apiStats.commentCount || 0, 10);

      await prisma.project.update({
        where: { id: project.id },
        data: {
          tiktokViews: views,
          tiktokLikes: likes,
          tiktokComments: comments,
        },
      });
      updated += 1;
    } catch (err) {
      console.error("[syncTikTokStats] fetch/update failed", project.id, err);
      continue;
    }
  }

  revalidatePath("/analytics");
  revalidatePath("/archive");

  return {
    success: true,
    data: { updated, total: projects.length },
  };
}

// ─── UPDATE PLATFORM IDS (Post-publish ID edits) ───────
export async function updatePlatformIds(
  projectId: string,
  ids: {
    youtubeId?: string;
    metaId?: string;
    tiktokId?: string;
    folderName?: string;
  }
): Promise<ActionResult> {
  const clean = (v: string | undefined) => {
    if (v === undefined) return undefined;
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  try {
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(ids.youtubeId !== undefined && { youtubeId: clean(ids.youtubeId) }),
        ...(ids.metaId !== undefined && { metaId: clean(ids.metaId) }),
        ...(ids.tiktokId !== undefined && { tiktokId: clean(ids.tiktokId) }),
        ...(ids.folderName !== undefined && { folderName: clean(ids.folderName) }),
      },
    });
    revalidatePath("/archive");
    revalidatePath("/analytics");
    revalidatePath("/pipeline");
    return { success: true, data: updated };
  } catch (err) {
    console.error("[updatePlatformIds]", err);
    return { success: false, error: "Failed to update platform IDs." };
  }
}

// ─── UPDATE PROJECT STATS (Manual analytics entry) ─────
export async function updateProjectStats(
  projectId: string,
  data: { views: number; likes: number; comments: number }
): Promise<ActionResult> {
  const views = Math.max(0, Math.floor(Number(data.views) || 0));
  const likes = Math.max(0, Math.floor(Number(data.likes) || 0));
  const comments = Math.max(0, Math.floor(Number(data.comments) || 0));

  try {
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { views, likes, comments },
    });
    revalidatePath("/analytics");
    revalidatePath("/archive");
    return { success: true, data: updated };
  } catch (err) {
    console.error("[updateProjectStats]", err);
    return { success: false, error: "Failed to update stats." };
  }
}

// ─── UPDATE PROJECT SHOTLIST (A-Roll / B-Roll JSON) ─────
export async function updateProjectShotlist(
  projectId: string,
  list: "aRoll" | "bRoll",
  shots: { id: string; text: string; isCompleted: boolean }[]
): Promise<ActionResult> {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(list === "aRoll"
          ? { aRollShots: JSON.stringify(shots) }
          : { bRollShots: JSON.stringify(shots) }),
      },
    });
    revalidatePath("/pipeline");
    return { success: true, data: null };
  } catch (err) {
    console.error("[updateProjectShotlist]", err);
    return { success: false, error: "Failed to update shotlist." };
  }
}
