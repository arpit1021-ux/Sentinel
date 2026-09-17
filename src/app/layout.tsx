import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Display face — carries the product's identity and section headers. A
// serif on purpose: the interface is a safety instrument, not a SaaS
// dashboard, and the wordmark should read as authored, not templated.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
});

// Body face — a humanist grotesque with more character than the default
// system stack, used for anything meant to be read as prose.
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

// Utility face — every number, timestamp, tactic id and status readout uses
// tabular monospace, the way an instrument panel does.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "SENTINEL — scam call interception",
  description: "The last thirty seconds before a scam succeeds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
