import type { Metadata } from "next";
import { requireOperatorSession } from "@/lib/auth";
import { getOperatorApplications } from "@/lib/dashboard-data";
import { FilterTable } from "@/components/filter-table";
import { WorkspaceShell } from "@/components/workspace-shell";
import { approvePartnerApplication, reviewPartnerApplication } from "@/lib/actions";

export const metadata: Metadata = { title: "Partner applications", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  await requireOperatorSession();
  const { items } = await getOperatorApplications();
  const rows = items.map((item) => {
    const action = (label: string, status: string) => ({ label, action: reviewPartnerApplication.bind(null, item.id, status) });
    const actions = item.status === "new" || item.status === "received"
      ? [action("Mark for review", "needs_review"), action("Nurture", "nurture")]
      : item.status === "needs_review"
        ? [action("Qualify", "qualified"), action("Nurture", "nurture")]
        : item.status === "qualified"
          ? [action("Start onboarding", "onboarding"), { label: "Approve", action: approvePartnerApplication.bind(null, item.id) }, action("Nurture", "nurture")]
          : item.status === "onboarding"
            ? [{ label: "Approve", action: approvePartnerApplication.bind(null, item.id) }]
            : item.status === "nurture"
              ? [action("Reopen review", "needs_review")]
              : [];
    return { id: item.id, href: `/operator/applications/${item.id}`, applicantName: item.applicantName, organizationName: item.organizationName, email: item.email, source: item.source.replaceAll("_", " "), status: item.status, submittedAt: item.submittedAt?.slice(0, 10), nextAction: item.nextAction, actions };
  });
  return <WorkspaceShell mode="operator"><div className="workspace-title-row"><div><span className="workspace-kicker">PARTNER INTAKE</span><h1>Applications</h1><p>Review the current queue and route each application to its next human action.</p></div></div><FilterTable columns={[{ key: "applicantName", label: "Applicant" }, { key: "organizationName", label: "Organization" }, { key: "email", label: "Email" }, { key: "source", label: "Source" }, { key: "status", label: "Status", kind: "status" }, { key: "submittedAt", label: "Received" }, { key: "nextAction", label: "Next action" }]} rows={rows} searchLabel="Search applications" emptyTitle="No applications in this workspace" emptyBody="Partner applications will appear here after intake records are received." /><p className="workspace-note">Triage actions are recorded in partner intake history. Final approval remains a separate human decision.</p></WorkspaceShell>;
}
