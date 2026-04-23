import Shell from "@/components/layout/Shell";
import SponsorshipsClient from "@/components/sponsorships/SponsorshipsClient";
import { prisma } from "@/lib/prisma";


export default async function SponsorshipsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params?.q?.trim();

  const sponsorships = await prisma.sponsorship.findMany({
    where: {
      ...(q && { brandName: { contains: q } }),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Shell>
      
        <SponsorshipsClient initialSponsorships={sponsorships} />
      
    </Shell>
  );
}
