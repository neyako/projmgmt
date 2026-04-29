"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import NextAuthSessionProvider from "@/components/providers/SessionProvider";
import { I18nProvider } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/locales";

interface ProvidersProps {
  children: ReactNode;
  locale: Locale;
}

export default function Providers({ children, locale }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider locale={locale}>
        <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
