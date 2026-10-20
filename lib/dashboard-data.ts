import "server-only";
import { requireOperatorSession, requirePartnerSession } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ListItem = { id: string; title: string; detail: string; href: string; status: string };
type ActivityItem = { id: string; title: string; detail: string; at: string };
type Dashboard = {
  displayName: string;
  organizationName: string;
  metrics: { label: string; value: string; detail: string }[];
  priorityItems: ListItem[];
  recentActivity: ActivityItem[];
};

async function getLinkedPartnerId() {
  const session = await requirePartnerSession();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("partner_portal_accounts")
    .select("partner_id")
    .eq("organization_id", session.organizationId)
    .eq("user_id", session.userId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error("Could not load the linked partner account");
  return { session, supabase, partnerId: data?.partner_id ?? null };
}

export async function getPartnerReferrals() {
  const { session, supabase, partnerId } = await getLinkedPartnerId();
  if (!partnerId) return { items: [] as { id: string; businessName: string; contactName?: string; status: string; submittedAt: string; nextAction?: string }[] };
  const { data, error } = await supabase
    .from("referrals")
    .select("id,lead_id,status,referred_at")
    .eq("organization_id", session.organizationId)
    .eq("partner_id", partnerId)
    .order("referred_at", { ascending: false })
    .limit(50);
  if (error) throw new Error("Could not load referrals");
  const leadIds = (data ?? []).map((row) => row.lead_id);
  const leadsResult = leadIds.length
    ? await supabase.from("leads").select("id,company_name,first_name,last_name").in("id", leadIds)
    : { data: [] as { id: string; company_name: string | null; first_name: string | null; last_name: string | null }[], error: null };
  if (leadsResult.error) throw new Error("Could not load referral details");
  const leads = new Map((leadsResult.data ?? []).map((lead) => [lead.id, lead]));
  return {
    items: (data ?? []).map((row) => {
      const lead = leads.get(row.lead_id);
      const contactName = [lead?.first_name, lead?.last_name].filter(Boolean).join(" ");
      return {
        id: row.id,
        businessName: lead?.company_name ?? "Business referral",
        contactName: contactName || undefined,
        status: row.status,
        submittedAt: row.referred_at,
        nextAction: row.status === "submitted" ? "Awaiting operator review" : undefined
      };
    })
  };
}

export async function getPartnerLinks() {
  const { session, supabase, partnerId } = await getLinkedPartnerId();
  if (!partnerId) return { items: [] as { id: string; label: string; url: string; destinationUrl?: string; clicks?: number; createdAt?: string }[] };
  const { data, error } = await supabase
    .from("tracking_links")
    .select("id,slug,destination_url,campaign,created_at")
    .eq("organization_id", session.organizationId)
    .eq("partner_id", partnerId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error("Could not load tracking links");
  return {
    items: (data ?? []).map((row) => ({
      id: row.id,
      label: row.campaign || row.slug,
      url: row.destination_url,
      destinationUrl: row.destination_url,
      clicks: undefined,
      createdAt: row.created_at
    }))
  };
}

const PARTNER_ACTIVITY_ACTIONS = [
  "partner_portal.access_claimed",
  "partner_referral.submitted",
  "partner_tracking_link.created"
];

export async function getPartnerActivity() {
  const { session, supabase, partnerId } = await getLinkedPartnerId();
  if (!partnerId) return { items: [] as { id: string; action: string; entityType: string; occurredAt: string }[] };
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id,action,entity_type,occurred_at")
    .eq("organization_id", session.organizationId)
    .in("action", PARTNER_ACTIVITY_ACTIONS)
    .order("occurred_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Could not load partner activity");
  return { items: (data ?? []).map((row) => ({ id: row.id, action: row.action, entityType: row.entity_type, occurredAt: row.occurred_at })) };
}

export async function getOperatorActivity() {
  const session = await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id,action,entity_type,occurred_at")
    .eq("organization_id", session.organizationId)
    .like("action", "partner_%")
    .order("occurred_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Could not load operator activity");
  return { items: (data ?? []).map((row) => ({ id: row.id, action: row.action, entityType: row.entity_type, occurredAt: row.occurred_at })) };
}

export async function getPartnerDashboard(): Promise<Dashboard> {
  const { session, partnerId } = await getLinkedPartnerId();
  const [{ items: referrals }, { items: links }] = await Promise.all([
    getPartnerReferrals(), getPartnerLinks()
  ]);
  const pending = referrals.filter((item) => item.status === "submitted").length;
  const priorityItems: ListItem[] = [];
  if (!partnerId) priorityItems.push({ id: "account", title: "Partner access pending", detail: "An operator needs to link your account to an approved partner record.", href: "/dashboard/settings", status: "Review needed" });
  if (partnerId && !links.length) priorityItems.push({ id: "links", title: "Create a tracking link", detail: "Share an approved destination with attribution.", href: "/dashboard/links", status: "Available" });
  if (partnerId && !referrals.length) priorityItems.push({ id: "referrals", title: "Submit a referral", detail: "Record a client introduction with consent.", href: "/dashboard/referrals", status: "Available" });
  if (pending) priorityItems.push({ id: "pending", title: `${pending} referral${pending === 1 ? "s" : ""} awaiting review`, detail: "Check the latest status in referrals.", href: "/dashboard/referrals", status: "In review" });
  return {
    displayName: session.email.split("@")[0] || "Partner",
    organizationName: session.organizationName,
    metrics: [
      { label: "Referrals", value: String(referrals.length), detail: "Most recent 50" },
      { label: "Awaiting review", value: String(pending), detail: "Submitted referrals" },
      { label: "Active links", value: String(links.length), detail: "Most recent 50" }
    ],
    priorityItems,
    recentActivity: referrals.slice(0, 5).map((item) => ({ id: item.id, title: item.businessName, detail: `Referral ${item.status}`, at: item.submittedAt }))
  };
}

export async function getOperatorApplications() {
  const session = await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("partner_applications")
    .select("id,applicant_name,agency_name,email,status,received_at")
    .eq("organization_id", session.organizationId)
    .order("received_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Could not load partner applications");
  return { items: (data ?? []).map((row) => ({
    id: row.id,
    applicantName: row.applicant_name || "Applicant",
    organizationName: row.agency_name || undefined,
    email: row.email || undefined,
    status: row.status,
    submittedAt: row.received_at,
    nextAction: row.status === "received" ? "Review application" : undefined
  })) };
}

export async function getOperatorTasks() {
  const session = await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("partner_follow_up_tasks")
    .select("id,title,status,due_at,notes,partner_id")
    .eq("organization_id", session.organizationId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Could not load partner tasks");
  const ids = [...new Set((data ?? []).map((row) => row.partner_id).filter((id): id is string => Boolean(id)))];
  const partnersResult = ids.length
    ? await supabase.from("partners").select("id,name").in("id", ids)
    : { data: [] as { id: string; name: string }[], error: null };
  if (partnersResult.error) throw new Error("Could not load task partners");
  const names = new Map((partnersResult.data ?? []).map((row) => [row.id, row.name]));
  return { items: (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    partnerName: row.partner_id ? names.get(row.partner_id) : undefined,
    status: row.status,
    dueAt: row.due_at || undefined,
    detail: row.notes || undefined
  })) };
}

export async function getOperatorPartners() {
  const session = await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("partners")
    .select("id,name,contact_email,status,created_at")
    .eq("organization_id", session.organizationId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Could not load partners");
  return { items: (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    organizationName: session.organizationName,
    email: row.contact_email || undefined,
    status: row.status,
    joinedAt: row.created_at
  })) };
}

export async function getOperatorDashboard(): Promise<Dashboard> {
  const session = await requireOperatorSession();
  const [{ items: applications }, { items: tasks }, { items: partners }] = await Promise.all([
    getOperatorApplications(), getOperatorTasks(), getOperatorPartners()
  ]);
  const newApplications = applications.filter((item) => ["received", "new", "pending"].includes(item.status)).length;
  const openTasks = tasks.filter((item) => !["completed", "cancelled"].includes(item.status)).length;
  const priorityItems: ListItem[] = [
    ...(newApplications ? [{ id: "applications", title: `${newApplications} applications to review`, detail: "Open the partner intake queue.", href: "/operator/applications", status: "Review needed" }] : []),
    ...(openTasks ? [{ id: "tasks", title: `${openTasks} open follow-up tasks`, detail: "Review owners and due dates.", href: "/operator/tasks", status: "Open" }] : [])
  ];
  return {
    displayName: session.email.split("@")[0] || "Operator",
    organizationName: session.organizationName,
    metrics: [
      { label: "Applications", value: String(applications.length), detail: "Most recent 100" },
      { label: "Open tasks", value: String(openTasks), detail: "Most recent 100" },
      { label: "Partners", value: String(partners.length), detail: "Most recent 100" }
    ],
    priorityItems,
    recentActivity: applications.slice(0, 5).map((item) => ({ id: item.id, title: item.applicantName, detail: `Application ${item.status}`, at: item.submittedAt }))
  };
}
