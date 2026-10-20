import type { Metadata } from "next";
import { requireOperatorSession } from "@/lib/auth";
import { getOperatorApplications } from "@/lib/dashboard-data";
import { FilterTable } from "@/components/filter-table";
import { WorkspaceShell } from "@/components/workspace-shell";
import { reviewPartnerApplication } from "@/lib/actions";

export const metadata: Metadata = { title: "Partner applications", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  await requireOperatorSession();
  const { items } = await getOperatorApplications();
  const rows = items.map((item) => ({ id: item.id, applicantName: item.applicantName, organizationName: item.organizationName, email: item.email, status: item.status, submittedAt: item.submittedAt?.slice(0, 10), nextAction: item.nextAction, actions: item.status === "new" || item.status === "received" ? [{ label: "Mark for review", action: reviewPartnerApplication.bind(null, item.id, "needs_review") }, { label: "Nurture", action: reviewPartnerApplication.bind(null, item.id, "nurture") }] : item.status === "needs_review" ? [{ label: "Qualify", action: reviewPartnerApplication.bind(null, item.id, "qualified") }, { label: "Nurture", action: reviewPartnerApplication.bind(null, item.id, "nurture") }] : item.status === "qualified" ? [{ label: "Start onboarding", action: reviewPartnerApplication.bind(null, item.id, "onboarding") }, { label: "Nurture", action: reviewPartnerApplication.bind(null, item.id, "nurture") }] : [] }));
  return <WorkspaceShell mode="operator"><div className="workspace-title-row"><div><span className="workspace-kicker">PARTNER INTAKE</span><h1>Applications</h1><p>Review the current queue and route each application to its next human action.</p></div></div><FilterTable columns={[{ key: "applicantName", label: "Applicant" }, { key: "organizationName", label: "Organization" }, { key: "email", label: "Email" }, { key: "status", label: "Status", kind: "status" }, { key: "submittedAt", label: "Received" }, { key: "nextAction", label: "Next action" }]} rows={rows} searchLabel="Search applications" emptyTitle="No applications in this workspace" emptyBody="Partner applications will appear here after intake records are received." /><p className="workspace-note">Triage actions are recorded in partner intake history. Final approval remains a separate human decision.</p></WorkspaceShell>;
}
