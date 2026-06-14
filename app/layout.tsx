import type { Metadata } from "next";
import { Saira, Saira_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const saira = Saira({ variable: "--font-saira", subsets: ["latin"], weight: ["400", "500", "600"] });
const sairaCond = Saira_Condensed({ variable: "--font-saira-cond", subsets: ["latin"], weight: ["500", "600", "700"] });
const jb = JetBrains_Mono({ variable: "--font-jb", subsets: ["latin"], weight: ["400", "500", "700"] });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://fifa-2026-liveboard.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "World Cup 2026 — Live Board",
  description:
    "Live board for the FIFA World Cup 2026 (USA · Canada · Mexico) — all 104 matches, group standings, live scores and US Eastern kickoff times.",
  openGraph: {
    title: "World Cup 2026 — Live Board",
    description:
      "All 104 matches, live group standings, scores and kickoff times for the FIFA World Cup 2026.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${saira.variable} ${sairaCond.variable} ${jb.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
