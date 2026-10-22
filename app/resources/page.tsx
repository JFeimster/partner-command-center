import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicInterior } from "@/components/public-interior";
import { ResourceLibrary } from "@/components/resource-library";

export const metadata: Metadata = { title: "Partner resources", description: "Search practical partner guides, referral tools, tracking links, and approved operating resources." };

export default function ResourcesPage() {
  return <PublicInterior compactHero eyebrow="FIELD LIBRARY / RESOURCES" title="Find the asset for the work in front of you." intro="Practical tools for partner conversations, intake readiness, attribution, and responsible referrals.">
    <section className="resource-center" aria-labelledby="resource-index">
      <div className="interior-section-head"><div><span className="eyebrow">OPERATING ASSETS</span><h2 id="resource-index">Partner resource center</h2></div><p>Search by task or filter by the work you do.</p></div>
      <ResourceLibrary />
      <aside className="resource-next-step"><div><span className="eyebrow">READY TO PUT IT TO WORK?</span><h2>Make your next referral count.</h2><p>Open your partner workspace to submit a referral or manage an attributed link.</p></div><div><Link href="/dashboard/referrals">Submit a referral <ArrowRight size={17}/></Link><Link href="/dashboard/links">Manage tracking links <ArrowRight size={17}/></Link></div></aside>
      <p className="interior-footnote">Funding resources support preparation and education. They do not determine eligibility, terms, approval, or funding outcomes.</p>
    </section>
  </PublicInterior>;
}
