import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: { default: "PULSO CRM", template: "%s — PULSO CRM" },
  description: "CRM operacional, comercial e financeiro da PULSO.",
  manifest: "/manifest.webmanifest"
};
export const viewport: Viewport = { themeColor: "#11110f", colorScheme: "dark light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased bg-[var(--carbon)] text-[var(--paper)]">
        {children}
      </body>
    </html>
  );
}
