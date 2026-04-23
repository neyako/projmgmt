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

  // Auto-resolve creator: use provided ID, or default to first Talent user
  let creatorId = formData.creatorId;
  if (!creatorId) {
    const defaultUser = await prisma.user.findFirst({ where: { role: "Talent" } });
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

  // ─── AUTO-ASSIGN EDITOR ─────────────────────────────
  let editingAssigneeId = project.editingAssigneeId;
  if (from === "Filming" && to === "Editing" && !editingAssigneeId) {
    const editorRole =
      project.format === "Short_Form" ? "Editor_Shorts" : "Editor_FullStack";
    const editor = await prisma.user.findFirst({ where: { role: editorRole } });
    if (editor) editingAssigneeId = editor.id;
  }

  try {
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: to,
        ...(editingAssigneeId && { editingAssigneeId }),
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

// ─── UPDATE PROJECT METADATA (Due Date + Assignees) ─────
export async function updateProjectMetadata(
  projectId: string,
  data: {
    dueDate?: string | null;
    assignedEditorId?: string | null;
    assignedCameramanId?: string | null;
    assignedTalentId?: string | null;
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
