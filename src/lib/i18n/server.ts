import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./locales";
import { format, getDictionary, lookup } from "./dictionaries";

export const LOCALE_COOKIE = "lang";

export async function getLocale(): Promise<Locale> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { language: true },
      });
      if (user?.language && isLocale(user.language)) {
        return user.language;
      }
    }
  } catch {
    // ignore — fall through to cookie
  }

  const store = await cookies();
  const cookieValue = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieValue)) return cookieValue;

  return DEFAULT_LOCALE;
}

export type ServerT = (key: string, vars?: Record<string, string | number>) => string;

export async function getT(): Promise<ServerT> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return (key, vars) => format(lookup(dict, key), vars);
}
