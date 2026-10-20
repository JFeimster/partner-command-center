"use client";

import { useMemo, useState } from "react";

export type TableColumn = { key: string; label: string; kind?: "status" | "url" | "date" };
export type TableAction = { label: string; action: (formData: FormData) => void | Promise<void> };
export type TableRow = { id: string; actions?: TableAction[]; [key: string]: string | number | TableAction[] | null | undefined };

function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch { return null; }
}

export function FilterTable({ columns, rows, searchLabel, emptyTitle, emptyBody }: { columns: TableColumn[]; rows: TableRow[]; searchLabel: string; emptyTitle: string; emptyBody: string }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const statuses = useMemo(() => Array.from(new Set(rows.map((row) => String(row.status || "")).filter(Boolean))).sort(), [rows]);
  const filtered = useMemo(() => rows.filter((row) => {
    if (status !== "all" && String(row.status || "") !== status) return false;
    const haystack = columns.map((column) => String(row[column.key] ?? "")).join(" ").toLocaleLowerCase();
    return haystack.includes(query.trim().toLocaleLowerCase());
  }), [columns, rows, query, status]);

  return <>
    {rows.length > 0 && <div className="table-tools"><label className="sr-only" htmlFor="table-search">{searchLabel}</label><input id="table-search" className="search-field" type="search" placeholder={searchLabel} value={query} onChange={(event) => setQuery(event.target.value)} />{statuses.length > 1 && <><label className="sr-only" htmlFor="table-status">Filter by status</label><select id="table-status" className="search-field" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map((option) => <option key={option} value={option}>{option}</option>)}</select></>}<span className="table-tools__count">{filtered.length} of {rows.length}</span></div>}
    {filtered.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}{filtered.some((row) => row.actions?.length) && <th scope="col">Action</th>}</tr></thead><tbody>{filtered.map((row) => <tr key={row.id}>{columns.map((column) => { const value = String(row[column.key] ?? ""); const url = column.kind === "url" ? safeUrl(value) : null; return <td key={column.key}>{column.kind === "status" ? <span className="status-label status-label--neutral">{value || "—"}</span> : url ? <a href={url} target="_blank" rel="noopener noreferrer">Open link ↗</a> : value || "—"}</td>; })}{filtered.some((entry) => entry.actions?.length) && <td><div className="table-row-actions">{row.actions?.map((action) => <form key={action.label} action={action.action}><button className="table-action" type="submit">{action.label}</button></form>)}</div></td>}</tr>)}</tbody></table></div> : <div className="empty-state"><strong>{rows.length ? "No matching records" : emptyTitle}</strong><p>{rows.length ? "Try a different search or status filter." : emptyBody}</p></div>}
  </>;
}
