import type { Metadata } from "next";
import Link from "next/link";
import { ClickFeedback } from "@/components/ClickFeedback";
import { DataProvider } from "@/components/DataProvider";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Revenue Healthcheck",
  description:
    "A revenue operations diagnostic: pipeline health, forecast accuracy, unit economics, and funnel efficiency, each scored against published benchmarks with the arithmetic on screen. Built by Chris Mongeon.",
};

const nav = [
  { href: "/pipeline", label: "Pipeline" },
  { href: "/forecast", label: "Forecast" },
  { href: "/unit-economics", label: "Unit economics" },
  { href: "/funnel", label: "Funnel" },
  { href: "/glossary", label: "Glossary" },
  { href: "/methodology", label: "Methodology" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <DataProvider>
          <header className="sticky top-0 z-30 border-b border-rule bg-sheet">
            <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-x-8 gap-y-1 px-4 py-3">
              <Link href="/" className="text-xl font-bold tracking-tight">
                Revenue Healthcheck
              </Link>
              <nav className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-2">
                {nav.map((n) => (
                  <Link key={n.href} href={n.href} className="hover:text-accent hover:underline underline-offset-4">
                    {n.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-8">{children}</main>
          <footer className="border-t border-rule bg-paper px-4 py-5 text-center text-xs text-ink-2">
            Built by{" "}
            <a href="https://mongeon.co" className="font-medium text-accent underline underline-offset-4 hover:text-accent-strong">
              Chris Mongeon
            </a>
            . The example company and its figures are illustrative. Benchmark ranges are published figures, cited on the{" "}
            <Link href="/methodology" className="underline underline-offset-4 hover:text-accent">
              methodology
            </Link>{" "}
            page.
          </footer>
          <ClickFeedback />
        </DataProvider>
      </body>
    </html>
  );
}
