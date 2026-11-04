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
  return <PublicInterior eyebrow="PARTNER INTAKE / 01" title="Build your place in the partner network." intro="Submit the short Join form, verify your email, and start using your partner workspace while your public profile remains in draft.">
    <section className="interior-grid" aria-labelledby="intake-heading"><div><span className="eyebrow">THE PROCESS</span><h2 id="intake-heading">Apply. Verify. Start building.</h2><ol className="number-list"><li><span>01</span><div><strong>Submit the Join form</strong><p>Share your name, email, and contact consent through the secure form.</p></div></li><li><span>02</span><div><strong>Verify your email</strong><p>Your verified identity is matched to the active partner record automatically.</p></div></li><li><span>03</span><div><strong>Open your workspace</strong><p>Build your profile, access tools, and plan your agency launch when ready.</p></div></li></ol><Link className="text-link" href="/auth/login">Already have an account? Sign in <ArrowRight size={16} /></Link></div><div id="application"><h2>Partner application</h2><p>Use the secure form below to submit your information.</p><TallyIntake attribution={attribution} /></div></section>
  </PublicInterior>;
}
