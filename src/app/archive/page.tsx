import Shell from "@/components/layout/Shell";
import ArchiveTable from "@/components/archive/ArchiveTable";
import { prisma } from "@/lib/prisma";


export default async function ArchivePage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params?.q?.trim();

  const publishedProjects = await prisma.project.findMany({
    where: {
      status: "Published",
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
      analytics: true,
    },
    orderBy: [{ publishDate: "desc" }],
  });

  const scrappedProjects = await prisma.project.findMany({
    where: {
      status: "Scrapped",
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
      analytics: true,
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <Shell>
      
        <ArchiveTable published={publishedProjects} scrapped={scrappedProjects} />
      
    </Shell>
  );
}
