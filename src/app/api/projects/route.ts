import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/projects — List all projects with relations
export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      creator: true,
      aRollAssignee: true,
      bRollAssignee: true,
      editingAssignee: true,
      shotlistItems: { orderBy: { order: "asc" } },
      analytics: true,
    },
    orderBy: [{ status: "asc" }, { columnOrder: "asc" }],
  });
  return NextResponse.json(projects);
}

// POST /api/projects — Create a new project
export async function POST(request: Request) {
  const body = await request.json();

  // Validate sponsored projects require briefing notes
  if (body.contentType === "Sponsored" && !body.briefingNotes) {
    return NextResponse.json(
      { error: "Sponsored projects require Briefing Notes." },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      title: body.title,
      contentType: body.contentType,
      format: body.format,
      platformsTargeted: JSON.stringify(body.platformsTargeted || []),
      briefingNotes: body.briefingNotes || null,
      creatorId: body.creatorId,
      status: "Ideation",
      columnOrder: 0,
    },
    include: {
      creator: true,
      aRollAssignee: true,
      bRollAssignee: true,
      editingAssignee: true,
      shotlistItems: true,
      analytics: true,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
