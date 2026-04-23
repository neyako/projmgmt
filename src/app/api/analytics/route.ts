import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/analytics — Aggregated analytics summary
export async function GET() {
  const analytics = await prisma.analytics.findMany({
    include: { project: { select: { title: true, status: true } } },
    orderBy: { fetchedAt: "desc" },
  });

  // Aggregate totals
  const totals = analytics.reduce(
    (acc, a) => ({
      views: acc.views + a.views,
      likes: acc.likes + a.likes,
      comments: acc.comments + a.comments,
    }),
    { views: 0, likes: 0, comments: 0 }
  );

  // Platform breakdown
  const platformBreakdown: Record<string, number> = {};
  analytics.forEach((a) => {
    platformBreakdown[a.platform] =
      (platformBreakdown[a.platform] || 0) + a.views;
  });

  return NextResponse.json({
    totals,
    platformBreakdown,
    records: analytics.slice(0, 50),
  });
}
