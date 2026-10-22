import { getOperatorReferrals } from "@/lib/dashboard-data";
import { toReferralCsv } from "@/lib/referral-operations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const status = new URL(request.url).searchParams.get("status");
  if (status && !["submitted", "accepted", "qualified", "converted", "rejected"].includes(status)) {
    return Response.json({ error: "Invalid status filter" }, { status: 400 });
  }
  const { items } = await getOperatorReferrals(1000);
  const filtered = status ? items.filter((item) => item.status === status) : items;
  const csv = toReferralCsv(filtered.map((item) => ({
    submitted_at: item.submittedAt,
    business: item.businessName,
    contact: item.contactName,
    partner: item.partnerName,
    status: item.status,
    source: item.source,
    campaign: item.campaign
  })));
  const filename = `partner-referrals-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, no-store"
    }
  });
}
