import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users — List all users
export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}
