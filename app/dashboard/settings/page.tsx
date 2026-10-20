import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requirePartnerSession } from "@/lib/auth";
import { WorkspaceShell } from "@/components/workspace-shell";

export const metadata: Metadata = { title: "Account settings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requirePartnerSession();
  return <WorkspaceShell mode="partner"><div className="workspace-title-row"><div><span className="workspace-kicker">ACCOUNT</span><h1>Settings</h1><p>Manage your business profile, session, and partner operating rules.</p></div></div><div className="settings-list"><div><span>PROFILE</span><div><h2>Business details</h2><p>Update your contact phone, website, service area, and business summary.</p></div><Link href="/dashboard/profile">Edit profile <ArrowUpRight size={17} /></Link></div><div><span>ACTIVATION</span><div><h2>Onboarding</h2><p>Review your live setup checklist and application status.</p></div><Link href="/dashboard/onboarding">Open checklist <ArrowUpRight size={17} /></Link></div><div><span>SESSION</span><div><h2>Account access</h2><p>Sign out when you finish working, especially on a shared device.</p></div><Link href="/auth/logout">Sign out <ArrowUpRight size={17} /></Link></div><div><span>GUIDANCE</span><div><h2>Partner rules</h2><p>Review consent, disclosure, and funding language before sharing links or referring a business.</p></div><Link href="/compliance">Open rules <ArrowUpRight size={17} /></Link></div><div><span>PRIVACY</span><div><h2>Privacy policy</h2><p>Understand the current information handling terms.</p></div><Link href="/privacy">Read policy <ArrowUpRight size={17} /></Link></div></div></WorkspaceShell>;
}
