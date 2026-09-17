import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SENTINEL — scam call interception",
  description: "The last thirty seconds before a scam succeeds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
