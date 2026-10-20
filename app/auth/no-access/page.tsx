import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { claimPartnerPortalAccess } from "@/lib/actions";

export const metadata: Metadata = { title: "Verify partner access", robots: { index: false, follow: false } };

export default async function NoAccessPage({ searchParams }: { searchParams: Promise<{ claim?: string }> }) {
  const params = await searchParams;
  return <AuthShell eyebrow="ACCOUNT VERIFICATION" title="Access needs review"><p className="auth-shell__intro">Your sign-in worked, but this account does not yet have portal access. If your approved partner record uses this verified email, link it below. An operator can review unmatched records.</p>{params.claim && <p className="form-notice form-notice--error" role="alert">No eligible partner record matched this email, or operator review is needed.</p>}<form action={claimPartnerPortalAccess} className="auth-form"><button type="submit">Link approved partner account <span aria-hidden="true">↗</span></button></form><Link className="auth-shell__secondary" href="/auth/logout">Sign out</Link></AuthShell>;
}
