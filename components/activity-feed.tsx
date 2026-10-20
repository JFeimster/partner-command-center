type ActivityItem = { id: string; action: string; entityType: string; occurredAt: string };

const LABELS: Record<string, string> = {
  "partner_portal.access_claimed": "Portal access linked",
  "partner_referral.submitted": "Referral submitted",
  "partner_tracking_link.created": "Tracking link created",
  "partner_task.completed": "Follow-up task completed"
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (!items.length) {
    return <div className="empty-state"><strong>No activity recorded yet</strong><p>Partner and operator actions will appear here after they are completed.</p></div>;
  }

  return <ol className="activity-feed">
    {items.map((item) => {
      const date = new Date(item.occurredAt);
      const label = LABELS[item.action] ?? item.action.replaceAll(".", " ").replaceAll("_", " ");
      return <li key={item.id}>
        <span className="activity-feed__marker" aria-hidden="true" />
        <div className="activity-feed__body"><strong>{label}</strong><span>{item.entityType.replaceAll("_", " ")}</span></div>
        <time dateTime={date.toISOString()}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date)} UTC</time>
      </li>;
    })}
  </ol>;
}
