import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Partner Command | Distilled Funding",
  description:
    "The operating workspace for Distilled Funding partners: leads, links, resources, production, and the next move.",
  openGraph: {
    type: "website",
    title: "Partner Command | Distilled Funding",
    description:
      "The operating workspace for Distilled Funding partners: leads, links, resources, production, and the next move.",
    images: ["https://partner-command-center-rho.vercel.app/assets/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Partner Command | Distilled Funding",
    description:
      "The operating workspace for Distilled Funding partners: leads, links, resources, production, and the next move.",
    images: ["https://partner-command-center-rho.vercel.app/assets/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/styles/base.css" />
        <link rel="stylesheet" href="/styles/public.css" />
        <link rel="stylesheet" href="/styles/components.css" />
        <link rel="stylesheet" href="/styles/utilities.css" />
        <link rel="stylesheet" href="/styles/dashboard-extensions.css" />
        <link rel="stylesheet" href="/dashboard.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
