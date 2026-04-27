import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/userSelect";

// GET /api/users — List all users
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (session.user.role === "MEMBER") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: publicUserSelect,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}
