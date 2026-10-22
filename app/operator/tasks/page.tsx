import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { requireOperatorSession } from "@/lib/auth";
import { getOperatorApplications, getOperatorPartners, getOperatorTasks } from "@/lib/dashboard-data";
import { FilterTable } from "@/components/filter-table";
import { WorkspaceShell } from "@/components/workspace-shell";
import { completePartnerTask, createPartnerFollowUpTask } from "@/lib/actions";

export const metadata: Metadata = { title: "Follow-up tasks", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ created?: string | string[]; error?: string | string[]; status?: string | string[] }> }) {
  const params = await searchParams;
  await requireOperatorSession();
  const created = Array.isArray(params.created) ? params.created[0] : params.created;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const requestedStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = requestedStatus === "open" || requestedStatus === "completed" ? requestedStatus : undefined;
  const [{ items }, { items: applications }, { items: partners }] = await Promise.all([
    getOperatorTasks(status), getOperatorApplications(), getOperatorPartners()
  ]);
  const rows = items.map((item) => ({ id: item.id, title: item.title, partnerName: item.partnerName, status: item.status, dueAt: item.dueAt?.slice(0, 10), detail: item.detail, actions: item.status === "open" ? [{ label: "Mark complete", action: completePartnerTask.bind(null, item.id) }] : [] }));
  return <WorkspaceShell mode="operator"><div className="workspace-title-row"><div><span className="workspace-kicker">FOLLOW-UP</span><h1>Task queue</h1><p>Assign yourself a next action, link it to a partner record, then track it through completion.</p></div></div>
    {created && <p className="form-notice" role="status">Follow-up task created and assigned to you.</p>}
    {error && <p className="form-notice form-notice--error" role="alert">Task could not be created. Check the title, linked record, and field lengths.</p>}
    <section className="workspace-section task-create" aria-labelledby="task-create-title"><div><span className="workspace-kicker">NEW ACTION</span><h2 id="task-create-title">Create a follow-up task</h2><p>Tasks stay in the partner operations ledger. No email or external message is sent.</p></div>
      <form action={createPartnerFollowUpTask} className="portal-form"><input type="hidden" name="task_id" value={randomUUID()} />
        <label>Task title<input className="portal-field" name="title" minLength={3} maxLength={160} required placeholder="Example: Confirm portal account claim" /></label>
        <div className="portal-form__grid"><label>Partner application <span className="portal-form__optional">Optional</span><select className="portal-field" name="application_id" defaultValue=""><option value="">No application linked</option>{applications.filter((item) => item.status !== "declined").map((item) => <option key={item.id} value={item.id}>{item.organizationName || item.applicantName} · {item.status}</option>)}</select></label>
          <label>Partner record <span className="portal-form__optional">Optional</span><select className="portal-field" name="partner_id" defaultValue=""><option value="">No partner linked</option>{partners.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
        <div className="portal-form__grid"><label>Due date <span className="portal-form__optional">Optional</span><input className="portal-field" type="date" name="due_date" /></label><label>Assign to <input className="portal-field" value="You" readOnly aria-label="Assigned operator" /></label></div>
        <label>Notes <span className="portal-form__optional">Optional · do not include sensitive financial details</span><textarea className="portal-field" name="notes" maxLength={2000} rows={3} placeholder="Add the context needed to complete this follow-up." /></label>
        <button type="submit" className="workspace-action">Create task</button>
      </form>
    </section>
    <FilterTable columns={[{ key: "title", label: "Task" }, { key: "partnerName", label: "Partner" }, { key: "status", label: "Status", kind: "status" }, { key: "dueAt", label: "Due" }, { key: "detail", label: "Detail" }]} rows={rows} searchLabel="Search tasks" emptyTitle="No follow-up tasks" emptyBody="Create an operator action above or tasks will appear when partner workflows need follow-up." initialStatus={status || "all"} />
  </WorkspaceShell>;
}
