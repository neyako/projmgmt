"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLocale, type Locale } from "./locales";
import { LOCALE_COOKIE } from "./server";

export async function setLocale(locale: Locale): Promise<{ ok: boolean; error?: string }> {
  if (!isLocale(locale)) {
    return { ok: false, error: "Invalid locale." };
  }

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { language: locale },
      });
    }
  } catch {
    // best-effort; cookie is still set
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
