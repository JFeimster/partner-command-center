import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Partner Command | Distilled Funding",
    template: "%s | Partner Command",
  },
  description:
    "The operating workspace for Distilled Funding partners: referrals, links, resources, and the next action.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
