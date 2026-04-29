import Shell from "@/components/layout/Shell";
import SponsorshipsClient from "@/components/sponsorships/SponsorshipsClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    include: {
      _count: {
        select: { projects: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const allSponsorships = await prisma.sponsorship.findMany({
    select: {
      budget: true,
      status: true,
      createdAt: true,
    },
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthlyTotals = Array.from({ length: currentMonth + 1 }, (_, monthIndex) => {
    const total = allSponsorships.reduce((sum, sponsorship) => {
      const closedAt = sponsorship.createdAt;
      const isSameMonth =
        closedAt.getFullYear() === currentYear &&
        closedAt.getMonth() === monthIndex;
      if (!isSameMonth || sponsorship.status === "Cancelled") return sum;
      return sum + sponsorship.budget;
    }, 0);

    const monthDate = new Date(currentYear, monthIndex, 1);
    const label = monthDate
      .toLocaleDateString("vi-VN", { month: "short" })
      .replace(/^Thg\s*/i, "THG ")
      .toUpperCase();

    return {
      key: `${currentYear}-${String(monthIndex + 1).padStart(2, "0")}`,
      label,
      total,
    };
  });

  const pendingSponsorships = allSponsorships.filter(
    (sponsorship) => sponsorship.status === "Pending"
  );

  const summary = {
    pendingCount: pendingSponsorships.length,
    pendingTotal: pendingSponsorships.reduce(
      (sum, sponsorship) => sum + sponsorship.budget,
      0
    ),
    currentMonthTotal: monthlyTotals[currentMonth]?.total ?? 0,
    currentMonthLabel: monthlyTotals[currentMonth]?.label ?? "",
    monthlyTotals,
  };

  return (
    <Shell>
      
        <SponsorshipsClient initialSponsorships={sponsorships} summary={summary} />
      
    </Shell>
  );
}
