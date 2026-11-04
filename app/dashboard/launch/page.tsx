import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";

export const metadata: Metadata = { title: "Launch your agency", robots: { index: false, follow: false } };

export default function LaunchPage() {
  return <WorkspaceShell mode="partner">
    <div className="workspace-title-row"><div><span className="workspace-kicker">OPTIONAL PLANNING</span><h1>Launch your agency</h1><p>Map the operating plan that fits your audience and referral workflow.</p></div><Link className="workspace-action workspace-action--secondary" href="/dashboard/onboarding"><ArrowLeft size={16} /> Back to onboarding</Link></div>
    <section className="portal-form-section"><div><span className="workspace-kicker">GUIDED PLAN</span><h2>Plan the next stage</h2><p>The Launch Your Agency form is optional. You can use your dashboard, profile editor, tools, and permitted referrals before completing it.</p></div><div><p className="workspace-note">This opens the existing A7edqy planning experience. Completion does not publish a profile or change referral eligibility.</p><a className="button button--yellow" href="https://tally.so/r/A7edqy" target="_blank" rel="noopener noreferrer">Open agency launch plan <ArrowUpRight size={17} /></a></div></section>
  </WorkspaceShell>;
}
