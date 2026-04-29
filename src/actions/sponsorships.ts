"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  convertCurrencyAmount,
  normalizeCurrency,
} from "@/lib/currency";
import { ensureFreshCurrencyRates } from "@/lib/currencyRates";
import { prisma } from "@/lib/prisma";
import { getPreferredCurrencyForUser } from "@/lib/userPreferences";

type ActionResult<T = unknown> = { success: true; data: T } | { success: false; error: string };

export async function getSponsorshipDeals() {
  const session = await getServerSession(authOptions);
  const preferredCurrency = await getPreferredCurrencyForUser(session?.user?.id);
  const rateSnapshot = await ensureFreshCurrencyRates();
  const deals = await prisma.sponsorship.findMany({
    where: {
      status: { in: ["Active", "Pending"] },
    },
    select: {
      id: true,
      brandName: true,
      contactEmail: true,
      budget: true,
      currency: true,
      status: true,
      dueDate: true,
      notes: true,
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { brandName: "asc" }],
  });

  return deals.map((deal) => ({
    ...deal,
    currency: normalizeCurrency(deal.currency),
    preferredCurrency,
    budgetPreferred: convertCurrencyAmount(
      deal.budget,
      deal.currency,
      preferredCurrency,
      rateSnapshot.rates
    ),
    dueDate: deal.dueDate ? deal.dueDate.toISOString() : null,
  }));
}

export async function createSponsorship(data: {
  brandName: string;
  contactEmail?: string;
  budget: number;
  currency?: string;
  status: string;
  dueDate?: string | null;
  notes?: string;
}): Promise<ActionResult> {
  try {
    const sponsorship = await prisma.sponsorship.create({
      data: {
        brandName: data.brandName,
        contactEmail: data.contactEmail || null,
        budget: data.budget,
        currency: normalizeCurrency(data.currency),
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes || null,
      },
    });
    revalidatePath("/sponsorships");
    revalidatePath("/pipeline");
    return { success: true, data: sponsorship };
  } catch (err) {
    console.error("[createSponsorship]", err);
    return { success: false, error: "Failed to create sponsorship." };
  }
}

export async function updateSponsorship(id: string, data: {
  brandName?: string;
  contactEmail?: string;
  budget?: number;
  currency?: string;
  status?: string;
  dueDate?: string | null;
  notes?: string;
}): Promise<ActionResult> {
  try {
    const sponsorship = await prisma.sponsorship.update({
      where: { id },
      data: {
        ...(data.brandName !== undefined && { brandName: data.brandName }),
        ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail || null }),
        ...(data.budget !== undefined && { budget: data.budget }),
        ...(data.currency !== undefined && { currency: normalizeCurrency(data.currency) }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
    });
    revalidatePath("/sponsorships");
    revalidatePath("/pipeline");
    revalidatePath("/archive");
    return { success: true, data: sponsorship };
  } catch (err) {
    console.error("[updateSponsorship]", err);
    return { success: false, error: "Failed to update sponsorship." };
  }
}

export async function deleteSponsorship(id: string): Promise<ActionResult> {
  try {
    await prisma.sponsorship.delete({ where: { id } });
    revalidatePath("/sponsorships");
    revalidatePath("/pipeline");
    revalidatePath("/archive");
    return { success: true, data: null };
  } catch (err) {
    console.error("[deleteSponsorship]", err);
    return { success: false, error: "Failed to delete sponsorship." };
  }
}
