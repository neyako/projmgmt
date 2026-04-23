import Shell from "@/components/layout/Shell";
import TeamClient from "@/components/team/TeamClient";
import { prisma } from "@/lib/prisma";


export default async function TeamPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params?.q?.trim();

  const users = await prisma.user.findMany({
    where: {
      ...(q && { name: { contains: q } }),
    },
    orderBy: { name: "asc" },
  });

  return (
    <Shell>
      
        <TeamClient initialUsers={users} />
      
    </Shell>
  );
}
