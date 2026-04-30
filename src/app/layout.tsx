import type { Metadata } from "next";
import Providers from "./providers";
import { getWorkspaceId } from "@/lib/appSettings";
import { formatWorkspaceDisplayName } from "@/lib/appSettingsConfig";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

const icons: Metadata["icons"] = {
  icon: [
    { url: "/icon.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
    { url: "/icon-light.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
  ],
  apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  shortcut: ["/icon.svg"],
};

export async function generateMetadata(): Promise<Metadata> {
  const workspaceName = formatWorkspaceDisplayName(await getWorkspaceId());

  return {
    title: `[ ${workspaceName} ] - projmgmt`,
    description: "projmgmt — self-hosted production management",
    icons,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Google Fonts: Doto, Space Grotesk, JetBrains Mono (Vietnamese-supporting monospace) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Doto:wght@400;500;700&family=Space+Grotesk:wght@300;400;500;700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400;1,700&display=swap&subset=latin,latin-ext,vietnamese"
          rel="stylesheet"
        />
        {/* Material Symbols Outlined */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-text-primary min-h-screen w-full antialiased">
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
