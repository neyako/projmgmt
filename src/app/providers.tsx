"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import NextAuthSessionProvider from "@/components/providers/SessionProvider";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
    </ThemeProvider>
  );
}
