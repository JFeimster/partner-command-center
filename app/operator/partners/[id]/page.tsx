import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { z } from "zod";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getOperatorPartnerDetail } from "@/lib/dashboard-data";

export const metadata: Metadata = { title: "Partner detail", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const detail = await getOperatorPartnerDetail(id);
  if (!detail) notFound();
  const { partner, referrals, links, portalAccounts, tasks } = detail;
  return <WorkspaceShell mode="operator">
    <Link className="detail-back" href="/operator/partners"><ArrowLeft size={15} /> Partner directory</Link>
    <div className="workspace-title-row"><div><span className="workspace-kicker">PARTNER NETWORK</span><h1>{partner.name}</h1><p>Joined {partner.created_at.slice(0, 10)} · Canonical partner record</p></div><span className="status-label">{partner.status}</span></div>
    <div className="detail-metrics"><div><span>Referrals</span><strong>{referrals}</strong><small>Recorded introductions</small></div><div><span>Active links</span><strong>{links}</strong><small>Attributed destinations</small></div><div><span>Portal access</span><strong>{portalAccounts}</strong><small>{portalAccounts ? "Active linked accounts" : "Awaiting verified claim"}</small></div></div>
    <div className="detail-layout"><section className="workspace-section detail-card" aria-labelledby="partner-details"><span className="workspace-kicker">RECORD</span><h2 id="partner-details">Partner details</h2><dl className="detail-list"><div><dt>Partner code</dt><dd>{partner.partner_code}</dd></div><div><dt>Contact email</dt><dd>{partner.contact_email || "Not recorded"}</dd></div><div><dt>Contact phone</dt><dd>{partner.contact_phone || "Not recorded"}</dd></div><div><dt>Status</dt><dd>{partner.status}</dd></div></dl><p className="workspace-note">Portal access becomes active after the approved contact signs in with the verified email and claims this record.</p></section><section className="workspace-section detail-card" aria-labelledby="partner-follow-up"><div className="workspace-section__head"><h2 id="partner-follow-up">Recent follow-up</h2><Link href="/operator/tasks">All tasks <ArrowRight size={14} /></Link></div>{tasks.length ? <div className="detail-task-list">{tasks.map((task) => <div key={task.id}><span><strong>{task.title}</strong><small>{task.due_at ? `Due ${task.due_at.slice(0, 10)}` : "No due date"} · {task.status}</small></span></div>)}</div> : <p className="detail-empty">No follow-up tasks are linked to this partner.</p>}</section></div>
  </WorkspaceShell>;
}
