import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STUDIO_OS",
  description: "Studio Management Dashboard — Self-Hosted Pipeline",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google Fonts: Doto, Space Grotesk, Space Mono */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Doto:wght@400;500;700&family=Space+Grotesk:wght@300;400;500;700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        {/* Material Symbols Outlined */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0a0a] text-white min-h-screen w-full antialiased">
        {children}
      </body>
    </html>
  );
}
