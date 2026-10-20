import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PublicInterior } from "@/components/public-interior";

export const metadata: Metadata = { title: "Marketplace", description: "Explore funding review paths and partner enablement resources." };

const paths = [
  { number: "01", type: "CAPITAL REVIEW", title: "Working capital", body: "A conversation about operating capital, cash flow, and a documented use of funds.", href: "/partner-access?source=marketplace&offer=working-capital-review" },
  { number: "02", type: "CAPITAL REVIEW", title: "Equipment finance", body: "A route for businesses evaluating equipment acquisition, replacement, or upgrades.", href: "/partner-access?source=marketplace&offer=equipment-finance-path" },
  { number: "03", type: "CAPITAL REVIEW", title: "Invoice cash flow", body: "A review path for businesses with receivables and payment timing gaps.", href: "/partner-access?source=marketplace&offer=invoice-cash-flow-review" },
  { number: "04", type: "READINESS", title: "Funding readiness", body: "Organize the business basics and documents before a funding conversation.", href: "/resources#readiness" },
];

export default function MarketplacePage() {
  return <PublicInterior eyebrow="MARKETPLACE / REVIEW PATHS" title="Find a useful path for the next conversation." intro="Browse common funding and readiness categories. Specific availability, eligibility, and terms depend on current provider review.">
    <section aria-labelledby="paths-heading"><div className="interior-section-head"><div><span className="eyebrow">THE DIRECTORY</span><h2 id="paths-heading">Review paths</h2></div><p>Use these as conversation starters. They are not live offers or lender decisions.</p></div><div className="directory-list">{paths.map((path) => <article key={path.number} className="directory-row"><span className="directory-row__number">{path.number}</span><div><span className="directory-row__type">{path.type}</span><h3>{path.title}</h3></div><p>{path.body}</p><Link href={path.href} aria-label={`Explore ${path.title}`}><ArrowUpRight size={23} /></Link></article>)}</div><p className="interior-footnote">No approval, amount, rate, timing, funding, or commission outcome is guaranteed. A qualified human reviewer determines the appropriate next step.</p></section>
  </PublicInterior>;
}
