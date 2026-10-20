import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicInterior } from "@/components/public-interior";
import { TallyIntake } from "@/components/tally-intake";

export const metadata: Metadata = { title: "Partner access", description: "Apply to join the Distilled Funding partner program." };

const ATTRIBUTION_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "partner_id", "partner", "ref", "affiliate", "affiliate_id", "source", "offer"] as const;

export default async function PartnerAccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const attribution = Object.fromEntries(ATTRIBUTION_KEYS.flatMap((key) => {
    const value = params[key];
    return typeof value === "string" && value.length <= 150 ? [[key, value]] : [];
  }));
  return <PublicInterior eyebrow="PARTNER INTAKE / 01" title="Build your place in the partner network." intro="Tell us about your audience and the way you work. An operator reviews each application and follows up on the next step.">
    <section className="interior-grid" aria-labelledby="intake-heading"><div><span className="eyebrow">THE PROCESS</span><h2 id="intake-heading">Apply. Review. Get oriented.</h2><ol className="number-list"><li><span>01</span><div><strong>Share your profile</strong><p>Describe your business, audience, and referral approach.</p></div></li><li><span>02</span><div><strong>Operator review</strong><p>The team reviews fit and any information needed.</p></div></li><li><span>03</span><div><strong>Workspace access</strong><p>Approved partners receive an onboarding path and access instructions.</p></div></li></ol><Link className="text-link" href="/auth/login">Already have an account? Sign in <ArrowRight size={16} /></Link></div><div id="application"><h2>Partner application</h2><p>Use the secure form below to submit your information.</p><TallyIntake attribution={attribution} /></div></section>
  </PublicInterior>;
}
