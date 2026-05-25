import Shell from "@/components/layout/Shell";
import KanbanBoardWrapper from "@/components/kanban/KanbanBoardWrapper";
import { prisma } from "@/lib/prisma";
import { projectUserSelect } from "@/lib/userSelect";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

const FREQUENT_HASHTAG_LIMIT = 8;

function getHashtagTokens(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map((token) => token.trim().replace(/^#+/, ""))
    .filter(Boolean);
}

function rankFrequentHashtags(rows: { hashtags: string | null }[]): string[] {
  const counts = new Map<
    string,
    { tag: string; count: number; firstSeen: number }
  >();

  rows.forEach((row, rowIndex) => {
    getHashtagTokens(row.hashtags).forEach((tag) => {
      const key = tag.toLocaleLowerCase();
      const current = counts.get(key);
      counts.set(key, {
        tag: current?.tag ?? tag,
        count: (current?.count ?? 0) + 1,
        firstSeen: current?.firstSeen ?? rowIndex,
      });
    });
  });

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.firstSeen - b.firstSeen)
    .slice(0, FREQUENT_HASHTAG_LIMIT)
    .map((entry) => entry.tag);
}

export default async function PipelinePage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const [params, session] = await Promise.all([
    searchParams,
    getServerSession(authOptions),
  ]);
  const q = params?.q?.trim();

  const [projects, hashtagProjects] = await Promise.all([
    prisma.project.findMany({
      where: {
        status: { notIn: ["Published", "Scrapped"] },
        ...(q && { title: { contains: q } }),
      },
      include: {
        creator: { select: projectUserSelect },
        aRollAssignee: { select: projectUserSelect },
        bRollAssignee: { select: projectUserSelect },
        editingAssignee: { select: projectUserSelect },
        assignedCameraman: { select: projectUserSelect },
        assignedEditor: { select: projectUserSelect },
        assignedTalent: { select: projectUserSelect },
        sponsorship: {
          select: {
            id: true,
            brandName: true,
            contactEmail: true,
            budget: true,
            currency: true,
            status: true,
            dueDate: true,
            notes: true,
          },
        },
        shotlistItems: { orderBy: { order: "asc" } },
      },
      orderBy: [{ columnOrder: "asc" }],
    }),
    session?.user?.id
      ? prisma.project.findMany({
          where: {
            creatorId: session.user.id,
            format: "Short_Form",
            hashtags: { not: null },
          },
          select: { hashtags: true },
          orderBy: [{ publishedAt: "desc" }, { publishDate: "desc" }],
          take: 100,
        })
      : Promise.resolve([]),
  ]);

  const frequentHashtags = rankFrequentHashtags(hashtagProjects);

  return (
    <Shell>
      <KanbanBoardWrapper
        initialProjects={projects}
        frequentHashtags={frequentHashtags}
      />
    </Shell>
  );
}
