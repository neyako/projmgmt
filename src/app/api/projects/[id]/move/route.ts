import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VALID_TRANSITIONS, type KanbanStage } from "@/lib/constants";
import { projectUserSelect } from "@/lib/userSelect";

// PATCH /api/projects/[id]/move — Column transition with validation guards
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { targetStatus } = await request.json();

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const from = project.status as KanbanStage;
  const to = targetStatus as KanbanStage;

  // ─── TRANSITION VALIDATION ──────────────────────────
  if (!VALID_TRANSITIONS[from]?.includes(to)) {
    return NextResponse.json(
      { error: `Cannot move from ${from} to ${to}` },
      { status: 400 }
    );
  }

  // Ideation → Scripting: must have title + content type
  if (from === "Ideation" && to === "Scripting") {
    if (!project.title || !project.contentType) {
      return NextResponse.json(
        { error: "Title and Content Type are required before Scripting." },
        { status: 400 }
      );
    }
  }

  // Scripting → Filming: must have A-Roll and B-Roll assignees
  if (from === "Scripting" && to === "Filming") {
    if (!project.aRollAssigneeId || !project.bRollAssigneeId) {
      return NextResponse.json(
        { error: "A-Roll and B-Roll assignees are required before Filming." },
        { status: 400 }
      );
    }
  }

  // Filming → Editing: both A-Roll and B-Roll must be complete
  if (from === "Filming" && to === "Editing") {
    if (!project.aRollComplete || !project.bRollComplete) {
      return NextResponse.json(
        { error: "Both A-Roll and B-Roll must be completed before Editing." },
        { status: 400 }
      );
    }
  }

  // Editing → Review: must have review link
  if (from === "Editing" && to === "Review") {
    if (!project.reviewLink) {
      return NextResponse.json(
        { error: "A Nextcloud Review Link is required before Review." },
        { status: 400 }
      );
    }
  }

  // ─── PERSIST MOVE ───────────────────────────────────
  const updated = await prisma.project.update({
    where: { id },
    data: {
      status: to,
      ...(to === "Published" && { publishDate: new Date() }),
    },
    include: {
      creator: { select: projectUserSelect },
      aRollAssignee: { select: projectUserSelect },
      bRollAssignee: { select: projectUserSelect },
      editingAssignee: { select: projectUserSelect },
      shotlistItems: true,
      analytics: true,
    },
  });

  return NextResponse.json(updated);
}
