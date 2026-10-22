export const REFERRAL_STATUSES = ["submitted", "accepted", "qualified", "converted", "rejected"] as const;
export type ReferralStatus = typeof REFERRAL_STATUSES[number];

const NEXT_STATUSES: Record<ReferralStatus, ReferralStatus[]> = {
  submitted: ["accepted", "rejected"],
  accepted: ["qualified", "rejected"],
  qualified: ["converted", "rejected"],
  converted: [],
  rejected: []
};

export function nextReferralStatuses(status: string): ReferralStatus[] {
  return REFERRAL_STATUSES.includes(status as ReferralStatus) ? NEXT_STATUSES[status as ReferralStatus] : [];
}

export function toReferralCsv(rows: Array<Record<string, string | null | undefined>>) {
  const columns = ["submitted_at", "business", "contact", "partner", "status", "source", "campaign"] as const;
  const escape = (value: string | null | undefined) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@\-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return [columns.join(","), ...rows.map((row) => columns.map((column) => escape(row[column])).join(","))].join("\r\n");
}
