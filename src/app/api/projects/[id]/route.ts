import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { projectUserSelect } from "@/lib/userSelect";

// GET /api/projects/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      creator: { select: projectUserSelect },
      aRollAssignee: { select: projectUserSelect },
      bRollAssignee: { select: projectUserSelect },
      editingAssignee: { select: projectUserSelect },
      shotlistItems: { orderBy: { order: "asc" } },
      analytics: { orderBy: { fetchedAt: "desc" } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

// PATCH /api/projects/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const project = await prisma.project.update({
    where: { id },
    data: body,
    include: {
      creator: { select: projectUserSelect },
      aRollAssignee: { select: projectUserSelect },
      bRollAssignee: { select: projectUserSelect },
      editingAssignee: { select: projectUserSelect },
      shotlistItems: { orderBy: { order: "asc" } },
      analytics: true,
    },
  });

  return NextResponse.json(project);
}

// DELETE /api/projects/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
