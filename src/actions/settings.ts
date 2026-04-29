"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSupportedCurrency, type CurrencyCode } from "@/lib/currency";
import { prisma } from "@/lib/prisma";

export async function setPreferredCurrency(
  currency: CurrencyCode
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupportedCurrency(currency)) {
    return { ok: false, error: "Invalid currency." };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { preferredCurrency: currency },
  });

  revalidatePath("/settings");
  revalidatePath("/sponsorships");
  revalidatePath("/pipeline");

  return { ok: true };
}
