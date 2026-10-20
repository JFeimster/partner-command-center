import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PublicInterior } from "@/components/public-interior";

export const metadata: Metadata = { title: "About", description: "Learn about the Partner Command operating workspace." };

export default function AboutPage() {
  return <PublicInterior eyebrow="ABOUT / THE WORK" title="Partner work deserves a clear operating surface." intro="Partner Command brings intake, referral visibility, tracking links, and resources into one workspace for Distilled Funding partners."><div className="legal-flow"><section><h2>Built around the next action</h2><p>The public site helps prospective partners understand the program and apply. The authenticated workspace helps partners see their current records and take the next appropriate step.</p></section><section><h2>Human review stays central</h2><p>Partner approval, funding decisions, and program terms require review by authorized people. The workspace records and organizes work; it does not make those decisions automatically.</p></section><section><Link className="button button--yellow" href="/partner-access">Apply for partner access <ArrowUpRight size={18} /></Link></section></div></PublicInterior>;
}
