import type { Metadata } from "next";
import { Check, CircleAlert, Clock3 } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { WixSyncExceptions } from "@/components/wix-sync-exceptions";
import { requireOperatorSession } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: "Wix contact sync", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type WixSyncException = Database["public"]["Functions"]["list_wix_contact_sync_exceptions"]["Returns"][number];

export default async function WixSyncPage({ searchParams }: { searchParams: Promise<{ retry?: string; error?: string }> }) {
  const session = await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const [{ data, error }, params] = await Promise.all([
    supabase.rpc("list_wix_contact_sync_exceptions", { p_organization_id: session.organizationId }),
    searchParams
  ]);
  const items: WixSyncException[] = data ?? [];
  const envChecks = [
    { label: "Wix API credential", ready: Boolean(process.env.WIX_API_KEY) },
    { label: "Supabase service credential", ready: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
    { label: "Cron authorization", ready: Boolean(process.env.CRON_SECRET) },
    { label: "Supabase endpoint", ready: Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) }
  ];
  const workerReady = envChecks.every((item) => item.ready);
  const retryCount = items.filter((item) => item.status === "retry").length;
  const failedCount = items.filter((item) => item.status === "failed").length;
  const mappingCount = items.filter((item) => item.status === "needs_mapping").length;

  return <WorkspaceShell mode="operator">
    <div className="workspace-title-row"><div><span className="workspace-kicker">INTEGRATIONS / WIX CONTACTS</span><h1>Wix sync</h1><p>Review source-backed contact projection health and safely queue retryable delivery events.</p></div></div>
    {params.retry && <p className="form-notice" role="status">Retry queued. The hourly worker will claim it on its next scheduled run.</p>}
    {params.error && <p className="form-notice form-notice--error" role="alert">Retry could not be queued. Recheck worker readiness and the current exception status.</p>}
    <section className="workspace-section wix-sync-readiness" aria-labelledby="wix-sync-readiness-title">
      <div className="workspace-section__head"><div><span className="workspace-kicker">WORKER READINESS</span><h2 id="wix-sync-readiness-title">{workerReady ? "Configured for scheduled delivery" : "Server configuration required"}</h2></div><span className={`status-pill ${workerReady ? "status-pill--active" : "status-pill--failed"}`}>{workerReady ? "Ready" : "Unavailable"}</span></div>
      <p className="workspace-section__hint">The project schedules the worker hourly. This page checks only whether each required server variable is present; it never reads or displays secret values.</p>
      <div className="wix-sync-readiness__grid">{envChecks.map((item) => <div className="wix-sync-readiness__item" key={item.label}>{item.ready ? <Check size={16} aria-hidden="true" /> : <CircleAlert size={16} aria-hidden="true" />}<span>{item.label}</span><strong>{item.ready ? "Configured" : "Missing"}</strong></div>)}</div>
      {!workerReady && <p className="workspace-note">Delivery remains paused until Wix API, Supabase service-role, Cron authorization, and endpoint variables are configured in the production server environment. No contact updates will be sent by this queue.</p>}
    </section>
    <div className="metric-strip metric-strip--four" aria-label="Wix sync exception counts"><div className="metric-strip__item"><span className="metric-strip__label">Retry scheduled</span><strong className="metric-strip__value">{retryCount}</strong><span className="metric-strip__detail">Transient failures</span></div><div className="metric-strip__item"><span className="metric-strip__label">Failed</span><strong className="metric-strip__value">{failedCount}</strong><span className="metric-strip__detail">Manual retry eligible</span></div><div className="metric-strip__item"><span className="metric-strip__label">Needs mapping</span><strong className="metric-strip__value">{mappingCount}</strong><span className="metric-strip__detail">Identity review required</span></div><div className="metric-strip__item"><span className="metric-strip__label">Schedule</span><strong className="metric-strip__value wix-sync-schedule"><Clock3 size={17} />Hourly</strong><span className="metric-strip__detail">Configured in Vercel</span></div></div>
    {error ? <div className="empty-state"><strong>Exception queue unavailable</strong><p>The scoped Supabase read did not succeed. Check integration logs or database permissions.</p></div> : <WixSyncExceptions items={items} canRetry={workerReady} />}
    <p className="workspace-note">The worker rechecks canonical source identity before each attempt. A retry only requeues the existing event; it does not create a Wix contact, change consent, or send marketing.</p>
  </WorkspaceShell>;
}
