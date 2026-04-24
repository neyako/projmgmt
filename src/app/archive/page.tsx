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
    },
    orderBy: [{ publishDate: "desc" }],
  });

  const publishedWithTotals = publishedProjects.map((project) => {
    const totalViews =
      (project.youtubeViews || 0) +
      (project.metaViews || 0) +
      (project.tiktokViews || 0);
    const totalLikes =
      (project.youtubeLikes || 0) +
      (project.metaLikes || 0) +
      (project.tiktokLikes || 0);
    const totalComments =
      (project.youtubeComments || 0) +
      (project.metaComments || 0) +
      (project.tiktokComments || 0);

    return {
      ...project,
      views: totalViews,
      likes: totalLikes,
      comments: totalComments,
    };
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
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <Shell>
      
        <ArchiveTable published={publishedWithTotals} scrapped={scrappedProjects} />
      
    </Shell>
  );
}
