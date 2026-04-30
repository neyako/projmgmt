"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import {
  getApplicationSettings,
  saveApplicationSettings as saveApplicationSettingsData,
} from "@/lib/appSettings";
import type { ApplicationSettings } from "@/lib/appSettingsConfig";
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

export async function getProjectFormSettings() {
  const settings = await getApplicationSettings();
  return { contentTypes: settings.contentTypes };
}

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  if (session.user.role !== "ADMIN") {
    return { ok: false, error: "Admin access required." };
  }

  return { ok: true };
}

export async function saveApplicationSettings(
  settings: Pick<ApplicationSettings, "publicUrl" | "contentTypes">
): Promise<{ ok: boolean; error?: string; settings?: ApplicationSettings }> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const result = await saveApplicationSettingsData(settings);
  if (!result.success) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/settings");
  revalidatePath("/pipeline");
  revalidatePath("/team");

  return { ok: true, settings: result.settings };
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
