import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { z } from "zod";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getOperatorReferralDetail } from "@/lib/dashboard-data";
import { updatePartnerReferralStatus } from "@/lib/actions";
import { nextReferralStatuses } from "@/lib/referral-operations";

export const metadata: Metadata = { title: "Referral details", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const labels: Record<string, string> = {
  submitted: "Submitted",
  accepted: "Accepted for follow-up",
  qualified: "Qualified for next review",
  converted: "Converted",
  rejected: "Closed"
};

export default async function OperatorReferralDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ updated?: string; error?: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [detail, query] = await Promise.all([getOperatorReferralDetail(id), searchParams]);
  if (!detail) notFound();
  const { item, history } = detail;
  const actions = nextReferralStatuses(item.status);

  return <WorkspaceShell mode="operator">
    <Link className="detail-back" href="/operator/referrals"><ArrowLeft size={15} /> Referral queue</Link>
    <div className="workspace-title-row"><div><span className="workspace-kicker">REFERRAL RECORD</span><h1>{item.businessName}</h1><p>Introduced by {item.partnerName} · Received {item.submittedAt.slice(0, 10)}</p></div><span className="status-label">{labels[item.status] || item.status}</span></div>
    {query.updated && <p className="form-notice" role="status">Referral status and partner activity history updated.</p>}
    {query.error && <p className="form-notice form-notice--error" role="alert">That status change is no longer available. Refresh the record and choose a current next action.</p>}
    <div className="detail-layout"><section className="workspace-section detail-card"><span className="workspace-kicker">INTRODUCTION</span><h2>Referral details</h2><dl className="detail-list"><div><dt>Business</dt><dd>{item.businessName}</dd></div><div><dt>Contact</dt><dd>{item.contactName || "Not provided"}</dd></div><div><dt>Contact email</dt><dd>{item.email || "Not provided"}</dd></div><div><dt>Partner</dt><dd><Link href={`/operator/partners/${item.partnerId}`}>{item.partnerName} <ArrowRight size={14} /></Link></dd></div><div><dt>Source</dt><dd>{item.source.replaceAll("_", " ")}</dd></div><div><dt>Campaign</dt><dd>{item.campaign || "Not recorded"}</dd></div></dl>
      {actions.length > 0 && <div className="detail-actions"><span className="workspace-kicker">OPERATOR STATUS UPDATE</span>{actions.map((status) => <form key={status} action={updatePartnerReferralStatus.bind(null, id, status)}><button className="table-action" type="submit">{status === "rejected" ? "Close referral" : labels[status]} <ArrowRight size={13} /></button></form>)}</div>}
      <p className="workspace-note">Updates are recorded for the partner and operator activity histories. Closed referrals cannot be reopened from this screen.</p>
    </section><section className="workspace-section detail-card"><div className="workspace-section__head"><div><span className="workspace-kicker">AUDIT TRAIL</span><h2>Status history</h2></div></div>{history.length ? <ol className="detail-timeline">{history.map((event) => { const meta = event.metadata && typeof event.metadata === "object" ? event.metadata as Record<string, unknown> : {}; const toStatus = typeof meta.to_status === "string" ? meta.to_status : ""; return <li key={event.id}><span>{event.occurred_at.slice(0, 10)}</span><strong>{toStatus ? `${labels[String(meta.from_status)] || String(meta.from_status)} → ${labels[toStatus] || toStatus}` : "Referral submitted"}</strong></li>; })}</ol> : <p className="detail-empty">No status events have been recorded for this referral yet.</p>}</section></div>
  </WorkspaceShell>;
}
