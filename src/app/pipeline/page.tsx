import Shell from "@/components/layout/Shell";
import KanbanBoardWrapper from "@/components/kanban/KanbanBoardWrapper";
import { prisma } from "@/lib/prisma";
import { ToastProvider } from "@/components/ui/Toast";

export default async function PipelinePage() {
  const projects = await prisma.project.findMany({
    where: { status: { not: "Published" } },
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
      <ToastProvider>
        <KanbanBoardWrapper initialProjects={projects} />
      </ToastProvider>
    </Shell>
  );
}
