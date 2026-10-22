import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { z } from "zod";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getOperatorApplicationDetail } from "@/lib/dashboard-data";
import { approvePartnerApplication, completePartnerTask, declinePartnerApplication, reviewPartnerApplication } from "@/lib/actions";

export const metadata: Metadata = { title: "Application detail", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ approved?: string; declined?: string; error?: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [detail, query] = await Promise.all([getOperatorApplicationDetail(id), searchParams]);
  if (!detail) notFound();
  const { application, events, tasks } = detail;
  const nextActions = application.status === "new" || application.status === "received"
    ? [{ label: "Mark for review", status: "needs_review" }, { label: "Nurture", status: "nurture" }]
    : application.status === "needs_review"
      ? [{ label: "Qualify", status: "qualified" }, { label: "Nurture", status: "nurture" }]
      : application.status === "qualified"
        ? [{ label: "Start onboarding", status: "onboarding" }, { label: "Nurture", status: "nurture" }]
        : application.status === "onboarding"
          ? []
          : application.status === "nurture"
            ? [{ label: "Reopen for review", status: "needs_review" }]
        : [];
  const canApprove = application.status === "qualified" || application.status === "onboarding";
  const canDecline = application.status !== "approved" && application.status !== "declined";
  const answers = application.answers && typeof application.answers === "object" && !Array.isArray(application.answers)
    ? Object.entries(application.answers).filter(([key]) => !/password|token|secret|ssn|routing|account.?number/i.test(key)).slice(0, 30)
    : [];

  return <WorkspaceShell mode="operator">
    <Link className="detail-back" href="/operator/applications"><ArrowLeft size={15} /> Applications</Link>
    <div className="workspace-title-row"><div><span className="workspace-kicker">PARTNER APPLICATION</span><h1>{application.applicant_name || "Applicant"}</h1><p>{application.agency_name || "Independent applicant"} · Received {application.received_at.slice(0, 10)}</p></div><span className="status-label">{application.status.replaceAll("_", " ")}</span></div>
    {query.approved && <p className="form-notice" role="status">Application approved and linked to a canonical partner record. Partner activation and account claim are separate next steps.</p>}
    {query.declined && <p className="form-notice" role="status">Application declined and the operator decision was recorded in intake history.</p>}
    {query.error && <p className="form-notice form-notice--error" role="alert">The requested application action could not be completed. Confirm the current status and required details.</p>}
    <div className="detail-layout"><section className="workspace-section detail-card" aria-labelledby="application-details"><span className="workspace-kicker">INTAKE RECORD</span><h2 id="application-details">Application details</h2><dl className="detail-list"><div><dt>Email</dt><dd>{application.email || "Not provided"}</dd></div><div><dt>Applicant type</dt><dd>{application.applicant_type.replaceAll("_", " ")}</dd></div><div><dt>Source</dt><dd>{application.source.replaceAll("_", " ")}</dd></div><div><dt>Last updated</dt><dd>{application.updated_at.slice(0, 10)}</dd></div><div><dt>Partner record</dt><dd>{application.partner_id ? <Link href={`/operator/partners/${application.partner_id}`}>Open linked partner <ArrowRight size={14} /></Link> : "Not yet linked"}</dd></div></dl>{answers.length > 0 && <section className="application-answers" aria-labelledby="application-answers-heading"><span className="workspace-kicker">APPLICANT RESPONSES</span><h3 id="application-answers-heading">Qualification details</h3><dl className="detail-list">{answers.map(([key, value]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{typeof value === "string" ? value : JSON.stringify(value)}</dd></div>)}</dl></section>}{nextActions.length > 0 && <div className="detail-actions"><span className="workspace-kicker">HUMAN TRIAGE</span>{nextActions.map((action) => <form key={action.status} action={reviewPartnerApplication.bind(null, id, action.status)}><button className="table-action" type="submit">{action.label} <ArrowRight size={13} /></button></form>)}</div>}{canApprove && <div className="detail-actions"><span className="workspace-kicker">OPERATOR DECISION</span><form action={approvePartnerApplication.bind(null, id)}><button className="table-action" type="submit">Approve and link partner <ArrowRight size={13} /></button></form></div>}{canDecline && <form className="detail-actions" action={declinePartnerApplication.bind(null, id)}><label className="workspace-kicker" htmlFor="decline-reason">DECLINE REASON</label><textarea id="decline-reason" name="reason" className="search-field" required minLength={3} maxLength={500} placeholder="Record a concise internal reason" /><button className="table-action" type="submit">Decline application</button></form>}<p className="workspace-note">Approval creates or links a pending canonical partner record. Activation requires a separate operator decision, and account claiming requires a verified matching email.</p></section>
    <div className="detail-stack"><section className="workspace-section detail-card" aria-labelledby="application-events"><div className="workspace-section__head"><h2 id="application-events">Intake history</h2></div>{events.length ? <ol className="detail-timeline">{events.map((event) => <li key={event.id}><span>{event.created_at.slice(0, 10)} · {event.source.replaceAll("_", " ")}</span><strong>{event.summary || event.event_type.replaceAll("_", " ")}</strong></li>)}</ol> : <p className="detail-empty">No intake events recorded for this application.</p>}</section><section className="workspace-section detail-card" aria-labelledby="application-tasks"><div className="workspace-section__head"><h2 id="application-tasks">Follow-up</h2><Link href="/operator/tasks">Task queue <ArrowRight size={14} /></Link></div>{tasks.length ? <div className="detail-task-list">{tasks.map((task) => <div key={task.id}><span><strong>{task.title}</strong><small>{task.due_at ? `Due ${task.due_at.slice(0, 10)}` : "No due date"} · {task.status}</small></span>{task.status === "open" && <form action={completePartnerTask.bind(null, task.id)}><button className="table-action" type="submit">Complete</button></form>}</div>)}</div> : <p className="detail-empty">No follow-up task is linked to this application.</p>}</section></div></div>
  </WorkspaceShell>;
}
