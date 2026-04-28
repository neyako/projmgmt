import Shell from "@/components/layout/Shell";
import KanbanBoardWrapper from "@/components/kanban/KanbanBoardWrapper";
import { prisma } from "@/lib/prisma";
import { projectUserSelect } from "@/lib/userSelect";

export const dynamic = "force-dynamic";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params?.q?.trim();

  const projects = await prisma.project.findMany({
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
          status: true,
          dueDate: true,
          notes: true,
        },
      },
      shotlistItems: { orderBy: { order: "asc" } },
    },
    orderBy: [{ columnOrder: "asc" }],
  });

  return (
    <Shell>
      
        <KanbanBoardWrapper initialProjects={projects} />
      
    </Shell>
  );
}
