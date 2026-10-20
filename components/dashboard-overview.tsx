import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export type DashboardData = {
  displayName: string;
  organizationName: string;
  metrics: { label: string; value: string | number; detail: string }[];
  priorityItems: { id: string; title: string; detail: string; href: string; status: string }[];
  recentActivity: { id: string; title: string; detail: string; at: string }[];
};

function safeInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//") ? href : "#";
}

export function DashboardOverview({ data, mode }: { data: DashboardData; mode: "partner" | "operator" }) {
  const isOperator = mode === "operator";
  return (
    <>
      <div className="workspace-title-row">
        <div><span className="workspace-kicker">{isOperator ? "OPERATOR OVERVIEW" : "PARTNER OVERVIEW"}</span><h1>{isOperator ? "Operations dashboard" : "Partner dashboard"}</h1><p>{isOperator ? "Applications, follow-up, and recent operational activity." : "Your referrals, tracking activity, and next actions."}</p></div>
        <Link className="workspace-action" href={isOperator ? "/operator/applications" : "/dashboard/referrals"}>{isOperator ? "Review applications" : "View referrals"}<ArrowUpRight size={16} /></Link>
      </div>
      {data.metrics.length > 0 && <div className="metric-strip" aria-label="Dashboard metrics">{data.metrics.slice(0, 3).map((metric) => <div className="metric-strip__item" key={metric.label}><span className="metric-strip__label">{metric.label}</span><strong className="metric-strip__value">{metric.value}</strong><span className="metric-strip__detail">{metric.detail}</span></div>)}</div>}
      <div className="dashboard-grid">
        <section className="workspace-section" aria-labelledby="priority-heading">
          <div className="workspace-section__head"><h2 id="priority-heading">Needs attention</h2><Link href={isOperator ? "/operator/tasks" : "/dashboard/referrals"}>View all <ArrowRight size={14} /></Link></div>
          <p className="workspace-section__hint">Items assigned to your current workspace.</p>
          {data.priorityItems.length ? <div className="work-list">{data.priorityItems.map((item) => <Link className="work-list__item" href={safeInternalHref(item.href)} key={item.id}><span><strong className="work-list__title">{item.title}</strong><span className="work-list__detail">{item.detail}</span></span><span className="work-list__right"><span className="status-label">{item.status}</span><ArrowUpRight size={17} /></span></Link>)}</div> : <div className="empty-state"><strong>No open items</strong><p>New items that need action will appear here when they are assigned to your workspace.</p><Link href={isOperator ? "/operator/applications" : "/dashboard/referrals"}>Open {isOperator ? "applications" : "referrals"} <ArrowRight size={14} /></Link></div>}
        </section>
        <section className="workspace-section" aria-labelledby="activity-heading">
          <div className="workspace-section__head"><h2 id="activity-heading">Recent activity</h2></div>
          <p className="workspace-section__hint">Recorded changes visible to your account.</p>
          {data.recentActivity.length ? <div className="activity-list">{data.recentActivity.slice(0, 7).map((item) => <div className="activity-list__item" key={item.id}><strong>{item.title}</strong><span>{item.detail}{item.at ? ` · ${item.at}` : ""}</span></div>)}</div> : <div className="empty-state"><strong>No activity recorded</strong><p>Account activity will show here after the first recorded action.</p></div>}
        </section>
      </div>
      <p className="workspace-note">Dashboard information reflects records available to your authenticated account. Funding decisions and partner approval require human review.</p>
    </>
  );
}
