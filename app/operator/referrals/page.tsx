import type { Metadata } from "next";
import Link from "next/link";
import { Download, ExternalLink } from "lucide-react";
import { FilterTable } from "@/components/filter-table";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getOperatorReferrals } from "@/lib/dashboard-data";
import { requireOperatorSession } from "@/lib/auth";
import { referralReviewAgeDays } from "@/lib/referral-operations";

export const metadata: Metadata = { title: "Partner referrals", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OperatorReferralsPage() {
  await requireOperatorSession();
  const { items } = await getOperatorReferrals();
  const pending = items.filter((item) => item.status === "submitted").length;
  const aging = items.filter((item) => item.status === "submitted" && (referralReviewAgeDays(item.submittedAt) ?? 0) >= 2).length;
  const inProgress = items.filter((item) => item.status === "accepted" || item.status === "qualified").length;
  const sourceCounts = new Map<string, number>();
  for (const item of items) sourceCounts.set(item.source, (sourceCounts.get(item.source) || 0) + 1);
  const sources = [...sourceCounts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  const rows = items.map((item) => ({
    id: item.id,
    href: `/operator/referrals/${item.id}`,
    businessName: item.businessName,
    partnerName: item.partnerName,
    source: item.source.replaceAll("_", " "),
    campaign: item.campaign,
    status: item.status,
    submittedAt: item.submittedAt.slice(0, 10),
    reviewAge: item.status !== "submitted" ? "—" : (() => {
      const days = referralReviewAgeDays(item.submittedAt);
      if (days === null) return "Unknown";
      if (days === 0) return "Today";
      return `${days} day${days === 1 ? "" : "s"}${days >= 2 ? " · follow-up due" : ""}`;
    })()
  })).sort((left, right) => {
    const leftPending = left.status === "submitted";
    const rightPending = right.status === "submitted";
    if (leftPending !== rightPending) return leftPending ? -1 : 1;
    if (leftPending) return left.submittedAt.localeCompare(right.submittedAt);
    return right.submittedAt.localeCompare(left.submittedAt);
  });

  return <WorkspaceShell mode="operator">
    <div className="workspace-title-row"><div><span className="workspace-kicker">ATTRIBUTED ACTIVITY</span><h1>Partner referrals</h1><p>Review introductions, maintain status history, and export authorized records.</p></div><a className="workspace-action" href="/api/operator/referrals/export"><Download size={16} /> Export CSV</a></div>
    <div className="metric-strip metric-strip--four" aria-label="Referral pipeline summary"><div className="metric-strip__item"><span className="metric-strip__label">Total referrals</span><strong className="metric-strip__value">{items.length}</strong><span className="metric-strip__detail">Recorded introductions</span></div><div className="metric-strip__item"><span className="metric-strip__label">Awaiting review</span><strong className="metric-strip__value">{pending}</strong><span className="metric-strip__detail">{aging} older than two days</span></div><div className="metric-strip__item"><span className="metric-strip__label">In progress</span><strong className="metric-strip__value">{inProgress}</strong><span className="metric-strip__detail">Accepted or qualified</span></div><div className="metric-strip__item"><span className="metric-strip__label">Sources</span><strong className="metric-strip__value">{new Set(items.map((item) => item.source)).size}</strong><span className="metric-strip__detail">Distinct recorded sources</span></div></div>
    <section className="workspace-section"><div className="workspace-section__head"><div><span className="workspace-kicker">PIPELINE</span><h2>Referral queue</h2></div><Link href="/operator/activity">Recent activity <ExternalLink size={14} /></Link></div>
      <FilterTable columns={[{ key: "businessName", label: "Business" }, { key: "partnerName", label: "Partner" }, { key: "source", label: "Source" }, { key: "campaign", label: "Campaign" }, { key: "status", label: "Status", kind: "status" }, { key: "submittedAt", label: "Received" }, { key: "reviewAge", label: "Review age" }]} rows={rows} searchLabel="Search business, partner, or source" emptyTitle="No referrals in this workspace" emptyBody="Partner introductions appear here after they are submitted with consent." />
    </section>
    <section className="workspace-section dashboard-sources" aria-labelledby="referral-sources-heading"><div className="workspace-section__head"><div><span className="workspace-kicker">ATTRIBUTION</span><h2 id="referral-sources-heading">Referral sources</h2></div></div><p className="workspace-section__hint">Source labels recorded on canonical lead records.</p>{sources.length ? <div className="source-bars">{sources.map((source) => <div className="source-bars__row" key={source.label}><span>{source.label.replaceAll("_", " ")}</span><div><i style={{ width: `${source.count / (sources[0]?.count || 1) * 100}%` }} /></div><strong>{source.count}</strong></div>)}</div> : <div className="empty-state"><strong>No referral attribution yet</strong><p>Recorded referral sources will appear after the first introduction.</p></div>}</section>
    <p className="workspace-note">Referral statuses describe operational handling. They do not represent a funding decision or guarantee.</p>
  </WorkspaceShell>;
}
