import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PublicInterior } from "@/components/public-interior";

export const metadata: Metadata = { title: "Developer resources", description: "Developer guides for Partner Command widgets and integrations." };

const guides = [
  { label: "QUICKSTART", title: "Developer overview", href: "/developers/index.html", description: "Find the current integration entry points and documentation." },
  { label: "WIDGET", title: "Embeddable widget", href: "/developers/widget-docs.html", description: "Review the standalone partner widget and its integration boundary." },
  { label: "API", title: "API documentation", href: "/developers/api-docs.html", description: "Read endpoint contracts before integrating an external client." },
  { label: "SECURITY", title: "Security guidance", href: "/developers/security.html", description: "Use the correct credentials, consent flow, and server-side boundaries." },
];

export default function DevelopersPage() {
  return <PublicInterior eyebrow="BUILD / DEVELOPER RESOURCES" title="Connect to the partner workflow." intro="Use the existing integration guides and widget documentation to understand the supported surfaces."><div className="directory-list">{guides.map((guide, index) => <article className="directory-row" key={guide.href}><span className="directory-row__number">{String(index + 1).padStart(2, "0")}</span><div><span className="directory-row__type">{guide.label}</span><h3>{guide.title}</h3></div><p>{guide.description}</p><Link href={guide.href} aria-label={`Open ${guide.title}`}><ArrowUpRight size={23} /></Link></article>)}</div><p className="interior-footnote">Check the live API contract and required authentication before using a guide in production.</p></PublicInterior>;
}
