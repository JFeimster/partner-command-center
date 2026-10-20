import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PublicInterior } from "@/components/public-interior";

export const metadata: Metadata = { title: "Resources", description: "Partner field resources for readiness, referrals, and responsible funding conversations." };

const resources = [
  { id: "readiness", label: "INTERACTIVE CHECKLIST", title: "Funding readiness checklist", detail: "Organize basic business information and documentation before a review.", href: "/tools/funding-readiness-checklist.html" },
  { id: "referrals", label: "OPERATING GUIDE", title: "Permission-based referrals", detail: "Ask for consent, share only what is needed, and keep the introduction truthful.", href: "/compliance#permission" },
  { id: "disclosure", label: "DISCLOSURE", title: "Affiliate disclosure", detail: "Understand how to disclose a partner or compensation relationship.", href: "/affiliate-disclosure" },
  { id: "tools", label: "INTERACTIVE TOOL", title: "Sales script generator", detail: "Draft an introduction or follow-up message for human review.", href: "/tools/sales-script-generator.html" },
];

export default function ResourcesPage() {
  return <PublicInterior eyebrow="FIELD LIBRARY / RESOURCES" title="Find the asset for the work in front of you." intro="Practical tools and guidance for partner conversations, intake readiness, and responsible referral activity."><section aria-labelledby="resource-index"><div className="interior-section-head"><div><span className="eyebrow">OPERATING ASSETS</span><h2 id="resource-index">Resource index</h2></div><p>Use the smallest resource that helps you take the next step.</p></div><div className="directory-list">{resources.map((resource, index) => <article id={resource.id} key={resource.id} className="directory-row"><span className="directory-row__number">{String(index + 1).padStart(2, "0")}</span><div><span className="directory-row__type">{resource.label}</span><h3>{resource.title}</h3></div><p>{resource.detail}</p><Link href={resource.href} aria-label={`Open ${resource.title}`}><ArrowUpRight size={23} /></Link></article>)}</div><p className="interior-footnote">These resources support readiness and responsible referral conversations. They do not determine eligibility or approval.</p></section></PublicInterior>;
}
