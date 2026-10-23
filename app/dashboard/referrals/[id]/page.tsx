import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getPartnerReferralDetail } from "@/lib/dashboard-data";
import { partnerReferralGuidance } from "@/lib/referral-operations";

export const metadata: Metadata = { title: "Referral details", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PartnerReferralDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const detail = await getPartnerReferralDetail(id);
  if (!detail) notFound();
  const { item, history } = detail;
  const guidance = partnerReferralGuidance(item.status);
  const labels = Object.fromEntries(["submitted", "accepted", "qualified", "converted", "rejected"].map((status) => [status, partnerReferralGuidance(status).label]));

  return <WorkspaceShell mode="partner">
    <Link className="detail-back" href="/dashboard/referrals"><ArrowLeft size={15} /> Referral pipeline</Link>
    <div className="workspace-title-row"><div><span className="workspace-kicker">REFERRAL UPDATE</span><h1>{item.businessName}</h1><p>Submitted {item.submittedAt.slice(0, 10)}{item.contactName ? ` · Contact ${item.contactName}` : ""}</p></div><span className="status-label">{guidance.label}</span></div>
    <div className="detail-layout"><section className="workspace-section detail-card"><span className="workspace-kicker">CURRENT STATUS</span><h2>{guidance.explanation}</h2><p>{guidance.nextAction}</p><p className="workspace-note">Statuses describe operational handling. They do not confirm funding, approval, terms, or compensation.</p></section>
      <section className="workspace-section detail-card"><div className="workspace-section__head"><div><span className="workspace-kicker">ACTIVITY</span><h2>Referral history</h2></div></div>{history.length ? <ol className="detail-timeline">{history.map((event) => { const meta = event.metadata && typeof event.metadata === "object" ? event.metadata as Record<string, unknown> : {}; const toStatus = typeof meta.to_status === "string" ? meta.to_status : ""; return <li key={event.id}><span>{event.occurred_at.slice(0, 10)}</span><strong>{toStatus ? `${labels[String(meta.from_status)] || "Status updated"} → ${labels[toStatus] || "Status updated"}` : "Referral submitted"}</strong></li>; })}</ol> : <p className="detail-empty">No status changes have been recorded yet.</p>}</section></div>
  </WorkspaceShell>;
}
