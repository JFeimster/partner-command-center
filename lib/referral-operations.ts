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

const PARTNER_STATUS_GUIDANCE: Record<ReferralStatus, { label: string; explanation: string; nextAction: string }> = {
  submitted: { label: "Submitted", explanation: "Your introduction is recorded and waiting for an operator to review it.", nextAction: "No action is needed from you right now. We will show an update here when its status changes." },
  accepted: { label: "Accepted for follow-up", explanation: "An operator has accepted the referral for follow-up.", nextAction: "Keep your contact informed that the introduction is in progress. Contact your Moonshine representative if key details change." },
  qualified: { label: "Qualified for next review", explanation: "The referral has moved to a further review step.", nextAction: "No funding decision is implied. Check this page for the next recorded status update." },
  converted: { label: "Converted", explanation: "The referral was marked converted in the partner operations system.", nextAction: "This operational status does not confirm funding, terms, or compensation. Contact your Moonshine representative for applicable program details." },
  rejected: { label: "Closed", explanation: "The referral is closed in the partner operations system.", nextAction: "Contact your Moonshine representative if you need clarification or believe this status needs review." }
};

export function partnerReferralGuidance(status: string) {
  if (Object.hasOwn(PARTNER_STATUS_GUIDANCE, status)) return PARTNER_STATUS_GUIDANCE[status as ReferralStatus];
  return { label: "Status updated", explanation: "An operator updated this referral.", nextAction: "Contact your Moonshine representative if you need help with the current status." };
}

export function referralReviewAgeDays(submittedAt: string, now = Date.now()) {
  const submittedTime = Date.parse(submittedAt);
  if (!Number.isFinite(submittedTime) || submittedTime > now) return null;
  return Math.floor((now - submittedTime) / 86_400_000);
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
