import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { requirePartnerSession } from "@/lib/auth";
import { getPartnerReferrals } from "@/lib/dashboard-data";
import { FilterTable } from "@/components/filter-table";
import { WorkspaceShell } from "@/components/workspace-shell";
import { ReferralForm } from "@/components/referral-form";

export const metadata: Metadata = { title: "Referrals", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ReferralsPage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string }> }) {
  const params = await searchParams;
  await requirePartnerSession();
  const { items } = await getPartnerReferrals();
  const rows = items.map((item) => ({ id: item.id, href: `/dashboard/referrals/${item.id}`, businessName: item.businessName, contactName: item.contactName, status: item.status, submittedAt: item.submittedAt?.slice(0, 10), nextAction: item.nextAction }));
  return <WorkspaceShell mode="partner"><div className="workspace-title-row"><div><span className="workspace-kicker">PIPELINE</span><h1>Referrals</h1><p>Partner-visible opportunities and their current review status.</p></div><a className="workspace-action" href="https://am-i-fundable.vercel.app/" target="_blank" rel="noopener noreferrer">Start a funding request <ArrowUpRight size={16} /></a></div>{params.submitted && <p className="form-notice" role="status">Referral recorded and routed for operator review.</p>}{params.error && <p className="form-notice form-notice--error" role="alert">Referral could not be saved. Check the details and active partner access, then try again.</p>}<section className="portal-form-section"><div><span className="workspace-kicker">NEW REFERRAL</span><h2>Introduce a business</h2><p>Share contact details only when you have permission.</p></div><ReferralForm /></section><FilterTable columns={[{ key: "businessName", label: "Business" }, { key: "contactName", label: "Contact" }, { key: "status", label: "Status", kind: "status" }, { key: "submittedAt", label: "Received" }, { key: "nextAction", label: "Next action" }]} rows={rows} searchLabel="Search referrals" emptyTitle="No referrals yet" emptyBody="Referrals attributed to your account will appear here when received." /><p className="workspace-note">Statuses are operational updates. They do not represent a funding decision or guarantee.</p></WorkspaceShell>;
}
