import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PublicInterior } from "@/components/public-interior";

export const metadata: Metadata = { title: "Partner access", description: "Learn how to request Partner Command access." };

export default function PricingPage() {
  return <PublicInterior eyebrow="ACCESS / PROGRAM TERMS" title="Start with a conversation about fit." intro="Program access and any commercial terms are confirmed during partner onboarding. There is no online checkout on this site."><div className="legal-flow"><section><h2>Public resources</h2><p>Browse the marketplace review paths, readiness tools, and operating guidance without an account.</p></section><section><h2>Partner workspace</h2><p>Approved partners can receive account access to their referrals, tracking links, resources, and related activity. Availability depends on the current program and operator review.</p></section><section><h2>Commercial terms</h2><p>Compensation, if applicable, is governed by a verified partner agreement. No commission amount or outcome is promised on this page.</p><Link className="button button--yellow" href="/partner-access">Request partner access <ArrowUpRight size={18} /></Link></section></div></PublicInterior>;
}
