import type { Metadata } from "next";
import Link from "next/link";
import { PublicInterior } from "@/components/public-interior";

export const metadata: Metadata = { title: "Partner rules", description: "Responsible language, consent, and privacy rules for partner referrals." };

export default function CompliancePage() {
  return <PublicInterior eyebrow="OPERATING RULES / COMPLIANCE" title="Make the introduction. Keep the promise honest." intro="Partner activity starts with consent and truthful expectations. Use these rules when discussing funding readiness, programs, and referrals."><div className="legal-flow">
    <section id="outcomes"><h2>Do not promise outcomes</h2><p>Partners may educate, introduce, and route business owners into a review path. Do not promise approval, funding, specific amounts, rates, terms, timelines, lender matches, commissions, or income.</p></section>
    <section id="language"><h2>Use review language</h2><p>Describe an exploratory step: “review funding readiness,” “explore possible options,” or “prepare information for consideration.” Availability and terms depend on the business profile and an authorized review.</p></section>
    <section id="permission"><h2>Get permission before sharing</h2><p>Ask the business owner before sending their contact or business information to a partner or operator. Share only the information needed for the agreed next step. Keep sensitive financial documents in approved, secure channels.</p></section>
    <section id="disclosure"><h2>Disclose the relationship</h2><p>If you may receive compensation or have a commercial relationship, disclose it clearly in the channel where you make the recommendation. Review the <Link className="text-link" href="/affiliate-disclosure">affiliate disclosure</Link> before publishing partner content.</p></section>
    <section id="review"><h2>Leave decisions to the right team</h2><p>A referral or readiness checklist is not underwriting, approval, credit advice, or a funding offer. Route questions about eligibility or terms to the authorized team.</p></section>
  </div></PublicInterior>;
}
