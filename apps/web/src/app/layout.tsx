import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PULSO CRM", template: "%s — PULSO CRM" },
  description: "CRM operacional, comercial e financeiro da PULSO.",
  manifest: "/manifest.webmanifest"
};
export const viewport: Viewport = { themeColor: "#11110f", colorScheme: "dark light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" suppressHydrationWarning><body>{children}</body></html>;
}
