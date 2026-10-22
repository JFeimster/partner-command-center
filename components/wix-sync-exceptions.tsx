"use client";

import { useMemo, useState } from "react";
import { retryWixContactSyncEvent } from "@/lib/actions";
import type { Database } from "@/lib/supabase/database.types";

type WixSyncException = Database["public"]["Functions"]["list_wix_contact_sync_exceptions"]["Returns"][number];

export function WixSyncExceptions({ items, canRetry }: { items: WixSyncException[]; canRetry: boolean }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = status === "all" || item.status === status;
      const searchable = [item.entity_kind, item.entity_id, item.status, item.last_error_code].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!normalized || searchable.includes(normalized));
    });
  }, [items, query, status]);

  return <section className="workspace-section" aria-labelledby="wix-exceptions-title">
    <div className="workspace-section__head"><div><span className="workspace-kicker">DELIVERY EXCEPTIONS</span><h2 id="wix-exceptions-title">Needs operator attention</h2></div><span className="wix-sync-count">{filtered.length} / {items.length} shown</span></div>
    <div className="wix-sync-controls">
      <label>Search exceptions<input className="portal-field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type, record ID, or error code" /></label>
      <label>Filter status<select className="portal-field" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All exception statuses</option><option value="retry">Retry scheduled</option><option value="failed">Failed</option><option value="needs_mapping">Needs identity mapping</option></select></label>
    </div>
    {filtered.length ? <div className="wix-sync-list">{filtered.map((item) => <article className="wix-sync-row" key={item.id}>
      <div className="wix-sync-row__main"><div className="wix-sync-row__top"><span className={`status-pill status-pill--${item.status}`}>{item.status.replaceAll("_", " ")}</span><span>{item.entity_kind.replaceAll("_", " ")}</span></div><strong>Source record <code>{item.entity_id}</code></strong><p>Error: <code>{item.last_error_code || "No error code recorded"}</code> · Attempts: {item.attempts}</p><small>Last updated {new Date(item.updated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</small></div>
      <div className="wix-sync-row__action">{item.status === "needs_mapping" ? <span className="workspace-note">Resolve the source contact match before retrying.</span> : canRetry ? <form action={retryWixContactSyncEvent}><input type="hidden" name="event_id" value={item.id} /><button className="workspace-action" type="submit">Queue retry</button></form> : <button className="workspace-action" type="button" disabled title="Server integration credentials are not configured">Retry unavailable</button>}</div>
    </article>)}</div> : <div className="empty-state"><strong>{items.length ? "No exceptions match these filters" : "No Wix delivery exceptions"}</strong><p>{items.length ? "Change the search or status filter to review another exception." : "The operator queue only lists retryable, failed, or unresolved identity events. No contact details or raw provider payloads are exposed here."}</p>{items.length > 0 && <button type="button" className="workspace-action workspace-action--secondary" onClick={() => { setQuery(""); setStatus("all"); }}>Reset filters</button>}</div>}
  </section>;
}
