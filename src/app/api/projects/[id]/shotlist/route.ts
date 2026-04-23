import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/shotlist
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const items = await prisma.shotlistItem.findMany({
    where: { projectId: id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(items);
}

// POST /api/projects/[id]/shotlist — Add new item
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const count = await prisma.shotlistItem.count({
    where: { projectId: id },
  });

  const item = await prisma.shotlistItem.create({
    data: {
      label: body.label,
      order: body.order ?? count,
      projectId: id,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

// PATCH /api/projects/[id]/shotlist — Toggle item
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { itemId, completed } = await request.json();

  const item = await prisma.shotlistItem.update({
    where: { id: itemId },
    data: { completed },
  });

  // Check if all shotlist items are complete → update bRollComplete
  const allItems = await prisma.shotlistItem.findMany({
    where: { projectId: id },
  });
  const allComplete = allItems.length > 0 && allItems.every((i) => i.completed);

  if (allComplete) {
    await prisma.project.update({
      where: { id },
      data: { bRollComplete: true },
    });
  } else {
    await prisma.project.update({
      where: { id },
      data: { bRollComplete: false },
    });
  }

  return NextResponse.json(item);
}
