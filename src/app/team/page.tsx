import Shell from "@/components/layout/Shell";
import TeamClient from "@/components/team/TeamClient";
import { prisma } from "@/lib/prisma";
import { teamUserSelect } from "@/lib/userSelect";

export const dynamic = "force-dynamic";

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
    select: teamUserSelect,
    orderBy: { name: "asc" },
  });

  const teamUsers = users.map(({ passwordHash, ...user }) => ({
    ...user,
    hasLogin: Boolean(user.username && passwordHash),
  }));

  return (
    <Shell>
      
        <TeamClient initialUsers={teamUsers} />
      
    </Shell>
  );
}
