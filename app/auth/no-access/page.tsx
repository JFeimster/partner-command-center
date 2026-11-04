import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Verify partner access", robots: { index: false, follow: false } };

export default async function NoAccessPage({ searchParams }: { searchParams: Promise<{ claim?: string }> }) {
  const params = await searchParams;
  return <AuthShell eyebrow="ACCOUNT VERIFICATION" title="Access needs review"><p className="auth-shell__intro">Your sign-in worked, but this account does not yet have portal access. Eligible partners are linked automatically after email verification. An operator can review unmatched, paused, or conflicting records.</p>{params.claim && <p className="form-notice form-notice--error" role="alert">No eligible active partner record matched this verified email, or operator review is needed.</p>}<Link className="auth-shell__secondary" href="/auth/logout">Sign out</Link></AuthShell>;
}
