import type { Metadata } from "next";
import Link from "next/link";
import { PublicInterior } from "@/components/public-interior";

export const metadata: Metadata = { title: "Affiliate disclosure" };

export default function DisclosurePage() {
  return <PublicInterior eyebrow="POLICIES / DISCLOSURE" title="Be clear about partner relationships." intro="A recommendation may involve a referral, affiliate, marketing, or compensation relationship."><div className="legal-flow"><section><h2>Clear disclosure</h2><p>If a partner may receive compensation for a referral or resulting activity, disclose that relationship clearly where the recommendation appears. A disclosure should be easy to notice and understand.</p></section><section><h2>No implied endorsement or outcome</h2><p>Do not describe a potential funding review as an approval, offer, guaranteed match, or certain commission event. Program availability and compensation terms must be verified.</p></section><section><h2>Full policy</h2><p>Read the <Link className="text-link" href="/affiliate-disclosure.html">complete affiliate disclosure</Link> and applicable partner agreement for the authoritative terms.</p></section></div></PublicInterior>;
}
