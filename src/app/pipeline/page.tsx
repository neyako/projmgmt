import Shell from "@/components/layout/Shell";
import KanbanBoardWrapper from "@/components/kanban/KanbanBoardWrapper";
import { prisma } from "@/lib/prisma";


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
      creator: true,
      aRollAssignee: true,
      bRollAssignee: true,
      editingAssignee: true,
      assignedCameraman: true,
      assignedEditor: true,
      assignedTalent: true,
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
