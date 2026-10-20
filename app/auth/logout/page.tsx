import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Sign out", robots: { index: false, follow: false } };

export default function LogoutPage() {
  return <AuthShell eyebrow="ACCOUNT SESSION" title="Sign out?"><p className="auth-shell__intro">End your current Partner Command session on this device.</p><form action={signOut} className="auth-form"><button type="submit">Sign out <span aria-hidden="true">↗</span></button></form><Link className="auth-shell__secondary" href="/dashboard">Return to workspace</Link></AuthShell>;
}
