import Shell from "@/components/layout/Shell";
import SponsorshipsClient from "@/components/sponsorships/SponsorshipsClient";
import { authOptions } from "@/lib/auth";
import { convertCurrencyAmount, normalizeCurrency } from "@/lib/currency";
import { ensureFreshCurrencyRates } from "@/lib/currencyRates";
import { prisma } from "@/lib/prisma";
import { getPreferredCurrencyForUser } from "@/lib/userPreferences";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export default async function SponsorshipsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params?.q?.trim();
  const session = await getServerSession(authOptions);
  const preferredCurrency = await getPreferredCurrencyForUser(session?.user?.id);
  const rateSnapshot = await ensureFreshCurrencyRates();

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

  const sponsorshipsWithConversion = sponsorships.map((sponsorship) => ({
    ...sponsorship,
    currency: normalizeCurrency(sponsorship.currency),
    budgetPreferred: convertCurrencyAmount(
      sponsorship.budget,
      sponsorship.currency,
      preferredCurrency,
      rateSnapshot.rates
    ),
  }));

  const allSponsorships = await prisma.sponsorship.findMany({
    select: {
      budget: true,
      currency: true,
      status: true,
      createdAt: true,
    },
  });

  const toPreferred = (budget: number, currency: string) =>
    convertCurrencyAmount(budget, currency, preferredCurrency, rateSnapshot.rates);

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
      return sum + (toPreferred(sponsorship.budget, sponsorship.currency) ?? 0);
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
  const missingRateCount = allSponsorships.filter(
    (sponsorship) =>
      normalizeCurrency(sponsorship.currency) !== preferredCurrency &&
      toPreferred(sponsorship.budget, sponsorship.currency) === null
  ).length;

  const summary = {
    pendingCount: pendingSponsorships.length,
    pendingTotal: pendingSponsorships.reduce(
      (sum, sponsorship) => sum + (toPreferred(sponsorship.budget, sponsorship.currency) ?? 0),
      0
    ),
    currentMonthTotal: monthlyTotals[currentMonth]?.total ?? 0,
    currentMonthLabel: monthlyTotals[currentMonth]?.label ?? "",
    monthlyTotals,
    missingRateCount,
  };

  return (
    <Shell>
      
        <SponsorshipsClient
          initialSponsorships={sponsorshipsWithConversion}
          preferredCurrency={preferredCurrency}
          rateSnapshot={rateSnapshot}
          summary={summary}
        />
      
    </Shell>
  );
}
