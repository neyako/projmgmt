"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSupportedCurrency, type CurrencyCode } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import type { NasConfig } from "@/utils/nasPaths";

export async function getNasConfig(): Promise<NasConfig> {
  // Bracket notation defeats Next.js DefinePlugin inlining of NEXT_PUBLIC_*
  // so the fallback actually reads runtime env, not build-time empty values.
  const env = process.env;
  return {
    nasIp: env.NAS_IP || env["NEXT_PUBLIC_NAS_IP"] || "",
    nasShare: env.NAS_SHARE || env["NEXT_PUBLIC_NAS_SHARE"] || "",
    nasRootDir: env.NAS_ROOT_DIR || env["NEXT_PUBLIC_NAS_ROOT_DIR"] || "",
  };
}

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
