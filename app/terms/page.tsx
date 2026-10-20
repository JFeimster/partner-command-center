import type { Metadata } from "next";
import Link from "next/link";
import { PublicInterior } from "@/components/public-interior";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return <PublicInterior eyebrow="POLICIES / TERMS" title="Use the workspace responsibly." intro="Partner Command is an operational tool for authorized partners and operators."><div className="legal-flow"><section><h2>Access and use</h2><p>Use account access only for your authorized organization and role. Partner and funding activity must follow applicable agreements, privacy requirements, and truthful marketing rules.</p></section><section><h2>Full terms</h2><p>Read the <Link className="text-link" href="/terms.html">complete terms of use</Link> for the authoritative conditions of access.</p></section></div></PublicInterior>;
}
