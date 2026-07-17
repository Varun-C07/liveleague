import type { Metadata } from "next";
import { Saira, Saira_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/design/theme";
import { DesignShell } from "@/components/design/DesignShell";

const saira = Saira({ variable: "--font-saira", subsets: ["latin"], weight: ["400", "500", "600"] });
const sairaCond = Saira_Condensed({ variable: "--font-saira-cond", subsets: ["latin"], weight: ["500", "600", "700"] });
const jb = JetBrains_Mono({ variable: "--font-jb", subsets: ["latin"], weight: ["400", "500", "700"] });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://live-league.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "LiveLeagues — Multi-Sport Live Tracker",
    template: "%s · LiveLeagues",
  },
  description:
    "One board for every live league — F1, World Cup soccer, NBA, cricket and MLB. Live scores, standings and schedules that refresh themselves.",
  openGraph: {
    title: "LiveLeagues — Multi-Sport Live Tracker",
    description: "Live scores and standings across F1, soccer, NBA, cricket and MLB — all in one place.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${saira.variable} ${sairaCond.variable} ${jb.variable}`}>
        <Providers>
          <ThemeProvider>
            <DesignShell>{children}</DesignShell>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
