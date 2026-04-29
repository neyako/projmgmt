import { prisma } from "@/lib/prisma";
import { DEFAULT_CURRENCY, normalizeCurrency, type CurrencyCode } from "@/lib/currency";

export async function getPreferredCurrencyForUser(
  userId: string | null | undefined
): Promise<CurrencyCode> {
  if (!userId) return DEFAULT_CURRENCY;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredCurrency: true },
  });

  return normalizeCurrency(user?.preferredCurrency);
}
