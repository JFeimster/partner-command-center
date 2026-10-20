import type { Metadata } from "next";
import { requireOperatorSession } from "@/lib/auth";
import { getOperatorTasks } from "@/lib/dashboard-data";
import { FilterTable } from "@/components/filter-table";
import { WorkspaceShell } from "@/components/workspace-shell";
import { completePartnerTask } from "@/lib/actions";

export const metadata: Metadata = { title: "Follow-up tasks", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  await requireOperatorSession();
  const { items } = await getOperatorTasks();
  const rows = items.map((item) => ({ id: item.id, title: item.title, partnerName: item.partnerName, status: item.status, dueAt: item.dueAt?.slice(0, 10), detail: item.detail, actions: item.status === "open" ? [{ label: "Mark complete", action: completePartnerTask.bind(null, item.id) }] : [] }));
  return <WorkspaceShell mode="operator"><div className="workspace-title-row"><div><span className="workspace-kicker">FOLLOW-UP</span><h1>Task queue</h1><p>Recorded partner follow-up tasks and their current status.</p></div></div><FilterTable columns={[{ key: "title", label: "Task" }, { key: "partnerName", label: "Partner" }, { key: "status", label: "Status", kind: "status" }, { key: "dueAt", label: "Due" }, { key: "detail", label: "Detail" }]} rows={rows} searchLabel="Search tasks" emptyTitle="No follow-up tasks" emptyBody="Assigned partner follow-up tasks will appear here when created." /></WorkspaceShell>;
}
