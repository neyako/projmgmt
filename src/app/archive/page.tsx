import Shell from "@/components/layout/Shell";
import ArchiveTable from "@/components/archive/ArchiveTable";
import { prisma } from "@/lib/prisma";
import { ToastProvider } from "@/components/ui/Toast";

export default async function ArchivePage() {
  const projects = await prisma.project.findMany({
    where: { status: "Published" },
    include: {
      creator: true,
      aRollAssignee: true,
      bRollAssignee: true,
      editingAssignee: true,
      assignedCameraman: true,
      assignedEditor: true,
      assignedTalent: true,
      shotlistItems: { orderBy: { order: "asc" } },
      analytics: true,
    },
    orderBy: [{ publishDate: "desc" }],
  });

  return (
    <Shell>
      <ToastProvider>
        <ArchiveTable initialProjects={projects} />
      </ToastProvider>
    </Shell>
  );
}
