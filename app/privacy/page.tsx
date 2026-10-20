import type { Metadata } from "next";
import Link from "next/link";
import { PublicInterior } from "@/components/public-interior";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return <PublicInterior eyebrow="POLICIES / PRIVACY" title="Your information deserves a clear boundary." intro="Partner applications and authenticated workspace activity involve personal and business information."><div className="legal-flow"><section><h2>Use approved channels</h2><p>Submit partner information through the application form and use authenticated workspace flows for operational records. Do not send sensitive business or financial documents through public links or informal messages.</p></section><section><h2>Full privacy policy</h2><p>The <Link className="text-link" href="/privacy.html">complete privacy policy</Link> describes the current data handling terms. Review it before submitting information.</p></section></div></PublicInterior>;
}
