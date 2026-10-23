import "server-only";
import { requireOperatorSession, requirePartnerSession } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prioritizeTasks } from "@/lib/task-aging";
import { buildOnboardingSteps, onboardingProgress } from "@/lib/partner-onboarding";

type ListItem = { id: string; title: string; detail: string; href: string; status: string };
type ActivityItem = { id: string; title: string; detail: string; at: string };
type Dashboard = {
  displayName: string;
  organizationName: string;
  metrics: { label: string; value: string; detail: string }[];
  priorityItems: ListItem[];
  recentActivity: ActivityItem[];
  onboarding?: { completed: number; total: number; nextHref: string; nextTitle: string };
  sourceBreakdown?: { label: string; count: number }[];
  operatorLifecycle?: { label: string; count: number; detail: string; href: string }[];
};

const ACTION_LABELS: Record<string, string> = {
  "partner_portal.access_claimed": "Portal access linked",
  "partner_profile.updated": "Business profile updated",
  "partner_referral.submitted": "Referral submitted",
  "partner_referral.status_changed": "Referral status updated",
  "partner_tracking_link.created": "Tracking link created",
  "partner_task.completed": "Follow-up task completed"
};
const activitySummary = (item: { id: string; action: string; entityType: string; occurredAt: string }) => ({
  id: item.id,
  title: ACTION_LABELS[item.action] || item.action.replaceAll("_", " ").replaceAll(".", " "),
  detail: item.entityType.replaceAll("_", " "),
  at: item.occurredAt
});

async function getLinkedPartnerId(returnTo = "/dashboard") {
  const session = await requirePartnerSession(returnTo);
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

function portalProfileFromMetadata(value: unknown) {
  const metadata = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const candidate = metadata.portal_profile;
  const profile = candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate as Record<string, unknown> : {};
  const field = (key: string) => typeof profile[key] === "string" ? profile[key] as string : "";
  return { websiteUrl: field("website_url"), serviceArea: field("service_area"), businessSummary: field("business_summary") };
}

export async function getPartnerProfile() {
  const { session, supabase, partnerId } = await getLinkedPartnerId();
  if (!partnerId) return { session, profile: null };
  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("id,name,partner_code,contact_email,contact_phone,status,metadata,created_at")
    .eq("organization_id", session.organizationId)
    .eq("id", partnerId)
    .maybeSingle();
  if (partnerError || !partner) throw new Error("Could not load partner profile");

  const [linksResult, referralsResult, linkedApplication] = await Promise.all([
    supabase.from("tracking_links").select("id", { count: "exact", head: true })
      .eq("organization_id", session.organizationId).eq("partner_id", partnerId).eq("is_active", true),
    supabase.from("referrals").select("id", { count: "exact", head: true })
      .eq("organization_id", session.organizationId).eq("partner_id", partnerId),
    supabase.from("partner_applications").select("id,status,received_at,agency_name")
      .eq("organization_id", session.organizationId).eq("partner_id", partnerId)
      .order("received_at", { ascending: false }).limit(1)
  ]);
  if (linksResult.error || referralsResult.error || linkedApplication.error) {
    throw new Error("Could not load onboarding progress");
  }
  let application = linkedApplication.data?.[0] ?? null;
  if (!application && partner.contact_email) {
    const { data, error } = await supabase.from("partner_applications")
      .select("id,status,received_at,agency_name")
      .eq("organization_id", session.organizationId).ilike("email", partner.contact_email)
      .order("received_at", { ascending: false }).limit(1);
    if (error) throw new Error("Could not load application status");
    application = data?.[0] ?? null;
  }
  return {
    session,
    profile: {
      id: partner.id,
      name: partner.name,
      partnerCode: partner.partner_code,
      email: partner.contact_email || session.email,
      phone: partner.contact_phone || "",
      status: partner.status,
      joinedAt: partner.created_at,
      ...portalProfileFromMetadata(partner.metadata),
      linkCount: linksResult.count ?? 0,
      referralCount: referralsResult.count ?? 0,
      application: application ? {
        id: application.id,
        status: application.status,
        receivedAt: application.received_at,
        agencyName: application.agency_name
      } : null
    }
  };
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

export async function getPartnerReferralDetail(id: string) {
  const { session, supabase, partnerId } = await getLinkedPartnerId(`/dashboard/referrals/${encodeURIComponent(id)}`);
  if (!partnerId) return null;
  const { data: row, error } = await supabase.from("referrals")
    .select("id,partner_id,lead_id,status,referred_at")
    .eq("organization_id", session.organizationId).eq("partner_id", partnerId).eq("id", id).maybeSingle();
  if (error) throw new Error("Could not load referral");
  if (!row) return null;
  const [leadResult, historyResult] = await Promise.all([
    supabase.from("leads").select("id,company_name,first_name,last_name").eq("organization_id", session.organizationId).eq("id", row.lead_id).maybeSingle(),
    supabase.from("activity_logs").select("id,action,metadata,occurred_at")
      .eq("organization_id", session.organizationId).eq("entity_type", "referral").eq("entity_id", id)
      .in("action", ["partner_referral.submitted", "partner_referral.status_changed"])
      .order("occurred_at", { ascending: true }).limit(100)
  ]);
  if (leadResult.error || historyResult.error) throw new Error("Could not load referral history");
  const lead = leadResult.data;
  const contactName = [lead?.first_name, lead?.last_name].filter(Boolean).join(" ");
  return {
    item: { id: row.id, businessName: lead?.company_name || "Business referral", contactName, status: row.status, submittedAt: row.referred_at },
    history: historyResult.data ?? []
  };
}

async function mapOperatorReferrals(
  rows: Array<{ id: string; partner_id: string; lead_id: string; status: string; referred_at: string }>,
  organizationId: string
) {
  const supabase = await createServerSupabaseClient();
  const leadIds = [...new Set(rows.map((row) => row.lead_id))];
  const partnerIds = [...new Set(rows.map((row) => row.partner_id))];
  const [leadsResult, partnersResult] = await Promise.all([
    leadIds.length ? supabase.from("leads").select("id,company_name,first_name,last_name,email,source,attribution").eq("organization_id", organizationId).in("id", leadIds) : Promise.resolve({ data: [], error: null }),
    partnerIds.length ? supabase.from("partners").select("id,name").eq("organization_id", organizationId).in("id", partnerIds) : Promise.resolve({ data: [], error: null })
  ]);
  if (leadsResult.error || partnersResult.error) throw new Error("Could not load referral details");
  const leads = new Map((leadsResult.data ?? []).map((lead) => [lead.id, lead]));
  const partners = new Map((partnersResult.data ?? []).map((partner) => [partner.id, partner.name]));
  return rows.map((row) => {
    const lead = leads.get(row.lead_id);
    const attribution = lead?.attribution && typeof lead.attribution === "object" && !Array.isArray(lead.attribution)
      ? lead.attribution as Record<string, unknown>
      : {};
    return {
      id: row.id,
      partnerId: row.partner_id,
      leadId: row.lead_id,
      businessName: lead?.company_name || "Business referral",
      contactName: [lead?.first_name, lead?.last_name].filter(Boolean).join(" ") || "",
      email: lead?.email || "",
      partnerName: partners.get(row.partner_id) || "Partner",
      status: row.status,
      source: lead?.source || "unknown",
      campaign: typeof attribution.campaign === "string" ? attribution.campaign : "",
      submittedAt: row.referred_at
    };
  });
}

export async function getOperatorReferrals(limit = 500) {
  const session = await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("referrals")
    .select("id,partner_id,lead_id,status,referred_at")
    .eq("organization_id", session.organizationId)
    .order("referred_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 1000));
  if (error) throw new Error("Could not load partner referrals");
  return { items: await mapOperatorReferrals(data ?? [], session.organizationId) };
}

export async function getOperatorReferralDetail(id: string) {
  const session = await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const { data: row, error } = await supabase.from("referrals")
    .select("id,partner_id,lead_id,status,referred_at")
    .eq("organization_id", session.organizationId).eq("id", id).maybeSingle();
  if (error) throw new Error("Could not load referral");
  if (!row) return null;
  const [item] = await mapOperatorReferrals([row], session.organizationId);
  const { data: history, error: historyError } = await supabase.from("activity_logs")
    .select("id,action,metadata,occurred_at")
    .eq("organization_id", session.organizationId).eq("entity_type", "referral").eq("entity_id", id)
    .in("action", ["partner_referral.submitted", "partner_referral.status_changed"])
    .order("occurred_at", { ascending: true }).limit(100);
  if (historyError) throw new Error("Could not load referral history");
  return { item, history: history ?? [] };
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
  "partner_profile.updated",
  "partner_referral.submitted",
  "partner_referral.status_changed",
  "partner_tracking_link.created"
];

export async function getPartnerActivity() {
  const { session, supabase, partnerId } = await getLinkedPartnerId();
  if (!partnerId) return { items: [] as { id: string; action: string; entityType: string; occurredAt: string }[] };
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id,action,entity_type,occurred_at,metadata")
    .eq("organization_id", session.organizationId)
    .in("action", PARTNER_ACTIVITY_ACTIONS)
    .order("occurred_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Could not load partner activity");
  return { items: (data ?? []).map((row) => {
    const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : {};
    const status = row.action === "partner_referral.status_changed" && typeof metadata.to_status === "string"
      ? `referral · ${metadata.to_status.replaceAll("_", " ")}`
      : row.entity_type;
    return { id: row.id, action: row.action, entityType: status, occurredAt: row.occurred_at };
  }) };
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
  const [{ session, profile }, { items: referrals }, { items: links }, { items: activity }] = await Promise.all([
    getPartnerProfile(), getPartnerReferrals(), getPartnerLinks(), getPartnerActivity()
  ]);
  const supabase = await createServerSupabaseClient();
  const pendingResult = profile ? await supabase.from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organizationId).eq("partner_id", profile.id).eq("status", "submitted") : null;
  if (pendingResult?.error) throw new Error("Could not load pending referrals");
  const pending = pendingResult?.count ?? 0;
  const steps = buildOnboardingSteps({ linked: Boolean(profile), phone: profile?.phone || "", websiteUrl: profile?.websiteUrl || "", serviceArea: profile?.serviceArea || "", linkCount: profile?.linkCount || 0, referralCount: profile?.referralCount || 0 });
  const progress = onboardingProgress(steps);
  const next = steps.find((step) => !step.complete);
  const priorityItems: ListItem[] = [];
  if (!profile) priorityItems.push({ id: "account", title: "Partner access pending", detail: "Claim your account with the verified email on your active partner record.", href: "/auth/no-access", status: "Review needed" });
  if (profile && next) priorityItems.push({ id: "setup", title: next.title, detail: next.detail, href: next.href, status: "Next step" });
  if (profile && !links.length) priorityItems.push({ id: "links", title: "Create a tracking link", detail: "Share an approved destination with attribution.", href: "/dashboard/links", status: "Available" });
  if (profile && !referrals.length) priorityItems.push({ id: "referrals", title: "Submit a referral", detail: "Record a client introduction with consent.", href: "/dashboard/referrals", status: "Available" });
  if (pending) priorityItems.push({ id: "pending", title: `${pending} referral${pending === 1 ? "s" : ""} awaiting review`, detail: "Check the latest status in referrals.", href: "/dashboard/referrals", status: "In review" });
  return {
    displayName: profile?.name || session.email.split("@")[0] || "Partner",
    organizationName: session.organizationName,
    metrics: [
      { label: "Referrals", value: String(profile?.referralCount ?? 0), detail: "All recorded referrals" },
      { label: "Awaiting review", value: String(pending), detail: "Submitted referrals" },
      { label: "Active links", value: String(profile?.linkCount ?? 0), detail: "Attributed links" }
    ],
    priorityItems,
    recentActivity: activity.slice(0, 5).map(activitySummary),
    onboarding: { ...progress, nextHref: next?.href || "/dashboard/onboarding", nextTitle: next?.title || "Setup complete" }
  };
}

const APPLICATION_STATUSES = new Set(["new", "received", "needs_review", "qualified", "onboarding", "approved", "declined", "nurture"]);
const PARTNER_STATUSES = new Set(["pending", "active", "paused", "terminated"]);

export async function getOperatorApplications(statuses?: string[]) {
  const session = await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const validStatuses = statuses?.filter((status) => APPLICATION_STATUSES.has(status));
  let query = supabase
    .from("partner_applications")
    .select("id,applicant_name,agency_name,email,status,source,received_at")
    .eq("organization_id", session.organizationId)
    .order("received_at", { ascending: false });
  if (validStatuses?.length === 1) query = query.eq("status", validStatuses[0]);
  else if (validStatuses?.length) query = query.in("status", validStatuses);
  const { data, error } = await query.limit(100);
  if (error) throw new Error("Could not load partner applications");
  return { items: (data ?? []).map((row) => ({
    id: row.id,
    applicantName: row.applicant_name || "Applicant",
    organizationName: row.agency_name || undefined,
    email: row.email || undefined,
    status: row.status,
    source: row.source,
    submittedAt: row.received_at,
    nextAction: row.status === "received" ? "Review application" : undefined
  })) };
}

export async function getOperatorApplicationDetail(id: string) {
  const session = await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const { data: application, error } = await supabase.from("partner_applications")
    .select("id,partner_id,applicant_name,agency_name,email,applicant_type,status,source,received_at,updated_at,answers")
    .eq("organization_id", session.organizationId).eq("id", id).maybeSingle();
  if (error) throw new Error("Could not load application");
  if (!application) return null;
  const [events, tasks] = await Promise.all([
    supabase.from("partner_intake_events")
      .select("id,event_type,summary,source,created_at")
      .eq("organization_id", session.organizationId).eq("application_id", id)
      .order("created_at", { ascending: false }).limit(30),
    supabase.from("partner_follow_up_tasks")
      .select("id,title,status,due_at,notes")
      .eq("organization_id", session.organizationId).eq("application_id", id)
      .order("created_at", { ascending: false }).limit(30)
  ]);
  if (events.error || tasks.error) throw new Error("Could not load application history");
  return { application, events: events.data ?? [], tasks: tasks.data ?? [] };
}

export async function getOperatorTasks(status?: "open" | "completed") {
  const session = await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("partner_follow_up_tasks")
    .select("id,title,status,due_at,notes,partner_id,created_at")
    .eq("organization_id", session.organizationId)
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query.limit(100);
  if (error) throw new Error("Could not load partner tasks");
  const ids = [...new Set((data ?? []).map((row) => row.partner_id).filter((id): id is string => Boolean(id)))];
  const partnersResult = ids.length
    ? await supabase.from("partners").select("id,name").in("id", ids)
    : { data: [] as { id: string; name: string }[], error: null };
  if (partnersResult.error) throw new Error("Could not load task partners");
  const names = new Map((partnersResult.data ?? []).map((row) => [row.id, row.name]));
  const prioritized = prioritizeTasks(data ?? []);
  return { items: prioritized.map((row) => ({
    id: row.id,
    title: row.title,
    partnerName: row.partner_id ? names.get(row.partner_id) : undefined,
    status: row.status,
    dueAt: row.due_at || undefined,
    detail: row.notes || undefined,
    urgency: row.urgency
  })) };
}

export async function getOperatorPartners(status?: string) {
  const session = await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("partners")
    .select("id,name,contact_email,status,partner_type,created_at,updated_at")
    .eq("organization_id", session.organizationId)
    // A QA partner may remain active for tests but must not appear as a real partner.
    .or("metadata->>fictional.is.null,metadata->>fictional.neq.true")
    .order("created_at", { ascending: false });
  if (status && PARTNER_STATUSES.has(status)) query = query.eq("status", status);
  const { data, error } = await query.limit(100);
  if (error) throw new Error("Could not load partners");
  const partnerIds = (data ?? []).map((row) => row.id);
  const lastActivity = new Map(partnerIds.map((id, index) => [id, data?.[index]?.updated_at || null]));
  if (partnerIds.length) {
    const [accounts, links, referrals, tasks] = await Promise.all([
      supabase.from("partner_portal_accounts").select("partner_id,updated_at").eq("organization_id", session.organizationId).in("partner_id", partnerIds),
      supabase.from("tracking_links").select("partner_id,updated_at").eq("organization_id", session.organizationId).in("partner_id", partnerIds),
      supabase.from("referrals").select("partner_id,updated_at").eq("organization_id", session.organizationId).in("partner_id", partnerIds),
      supabase.from("partner_follow_up_tasks").select("partner_id,updated_at").eq("organization_id", session.organizationId).in("partner_id", partnerIds)
    ]);
    if (accounts.error || links.error || referrals.error || tasks.error) throw new Error("Could not load partner activity recency");
    const recordActivity = (events: Array<{ partner_id: string | null; updated_at: string | null }>) => {
      for (const event of events) {
        if (!event.partner_id || !event.updated_at) continue;
        const current = lastActivity.get(event.partner_id);
        const eventTime = Date.parse(event.updated_at);
        const currentTime = current ? Date.parse(current) : Number.NaN;
        if (Number.isFinite(eventTime) && (!Number.isFinite(currentTime) || eventTime > currentTime)) {
          lastActivity.set(event.partner_id, event.updated_at);
        }
      }
    };
    recordActivity(accounts.data ?? []);
    recordActivity(links.data ?? []);
    recordActivity(referrals.data ?? []);
    recordActivity(tasks.data ?? []);
  }
  return { items: (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    organizationName: session.organizationName,
    email: row.contact_email || undefined,
    status: row.status,
    partnerType: row.partner_type,
    joinedAt: row.created_at,
    lastActivityAt: lastActivity.get(row.id) || undefined
  })) };
}

export async function getOperatorPartnerDetail(id: string) {
  const session = await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const { data: partner, error } = await supabase.from("partners")
    .select("id,name,partner_code,contact_email,contact_phone,status,partner_type,created_at")
    .eq("organization_id", session.organizationId).eq("id", id).maybeSingle();
  if (error) throw new Error("Could not load partner");
  if (!partner) return null;
  const [referrals, links, portalAccounts, tasks] = await Promise.all([
    supabase.from("referrals").select("id", { count: "exact", head: true })
      .eq("organization_id", session.organizationId).eq("partner_id", id),
    supabase.from("tracking_links").select("id", { count: "exact", head: true })
      .eq("organization_id", session.organizationId).eq("partner_id", id).eq("is_active", true),
    supabase.from("partner_portal_accounts").select("user_id", { count: "exact", head: true })
      .eq("organization_id", session.organizationId).eq("partner_id", id).eq("status", "active"),
    supabase.from("partner_follow_up_tasks").select("id,title,status,due_at")
      .eq("organization_id", session.organizationId).eq("partner_id", id)
      .order("created_at", { ascending: false }).limit(20)
  ]);
  if (referrals.error || links.error || portalAccounts.error || tasks.error) throw new Error("Could not load partner operations");
  return { partner, referrals: referrals.count ?? 0, links: links.count ?? 0, portalAccounts: portalAccounts.count ?? 0, tasks: tasks.data ?? [] };
}

export async function getOperatorDashboard(): Promise<Dashboard> {
  const session = await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const [{ items: applications }, { items: activity }, applicationsCount, newApplicationsCount, qualifiedApplicationsCount, approvedApplicationsCount, openTasksCount, pendingActivationCount, activePartnersCount, linkedAccountsCount, referralCount, pendingReferralCount] = await Promise.all([
    getOperatorApplications(), getOperatorActivity(),
    supabase.from("partner_applications").select("id", { count: "exact", head: true }).eq("organization_id", session.organizationId),
    supabase.from("partner_applications").select("id", { count: "exact", head: true }).eq("organization_id", session.organizationId).in("status", ["new", "received", "needs_review"]),
    supabase.from("partner_applications").select("id", { count: "exact", head: true }).eq("organization_id", session.organizationId).in("status", ["qualified", "onboarding"]),
    supabase.from("partner_applications").select("id", { count: "exact", head: true }).eq("organization_id", session.organizationId).eq("status", "approved"),
    supabase.from("partner_follow_up_tasks").select("id", { count: "exact", head: true }).eq("organization_id", session.organizationId).eq("status", "open"),
    supabase.from("partners").select("id", { count: "exact", head: true }).eq("organization_id", session.organizationId).eq("status", "pending").or("metadata->>fictional.is.null,metadata->>fictional.neq.true"),
    supabase.from("partners").select("id", { count: "exact", head: true }).eq("organization_id", session.organizationId).eq("status", "active").or("metadata->>fictional.is.null,metadata->>fictional.neq.true"),
    supabase.from("partner_portal_accounts").select("user_id", { count: "exact", head: true }).eq("organization_id", session.organizationId).eq("status", "active"),
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("organization_id", session.organizationId),
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("organization_id", session.organizationId).eq("status", "submitted")
  ]);
  if ([applicationsCount, newApplicationsCount, qualifiedApplicationsCount, approvedApplicationsCount, openTasksCount, pendingActivationCount, activePartnersCount, linkedAccountsCount, referralCount, pendingReferralCount].some((result) => result.error)) {
    throw new Error("Could not load operator metrics");
  }
  const newApplications = newApplicationsCount.count ?? 0;
  const qualifiedApplications = qualifiedApplicationsCount.count ?? 0;
  const approvedApplications = approvedApplicationsCount.count ?? 0;
  const openTasks = openTasksCount.count ?? 0;
  const pendingActivation = pendingActivationCount.count ?? 0;
  const activePartners = activePartnersCount.count ?? 0;
  const linkedAccounts = linkedAccountsCount.count ?? 0;
  const referrals = referralCount.count ?? 0;
  const pendingReferrals = pendingReferralCount.count ?? 0;
  const sources = new Map<string, number>();
  for (const item of applications) sources.set(item.source, (sources.get(item.source) || 0) + 1);
  const sourceBreakdown = [...sources].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  const priorityItems: ListItem[] = [
    ...(newApplications ? [{ id: "applications", title: `${newApplications} applications to review`, detail: "Open the partner intake queue.", href: "/operator/applications", status: "Review needed" }] : []),
    ...(pendingReferrals ? [{ id: "referrals", title: `${pendingReferrals} new referrals`, detail: "Review attributed partner introductions.", href: "/operator/referrals", status: "Review needed" }] : []),
    ...(openTasks ? [{ id: "tasks", title: `${openTasks} open follow-up tasks`, detail: "Review owners and due dates.", href: "/operator/tasks", status: "Open" }] : []),
    ...(activePartners > 0 && linkedAccounts === 0 ? [{ id: "activation", title: "Partner portal activation", detail: "Active partners have not yet claimed portal access.", href: "/operator/partners", status: "Ready" }] : [])
  ];
  const operatorLifecycle = [
    { label: "Qualification", count: qualifiedApplications, detail: "Applications qualified or in onboarding", href: "/operator/applications?stage=qualification" },
    { label: "Approved", count: approvedApplications, detail: "Applications approved by an operator", href: "/operator/applications?stage=approved" },
    { label: "Pending activation", count: pendingActivation, detail: "Canonical partner records not yet active", href: "/operator/partners?status=pending" }
  ];
  return {
    displayName: session.email.split("@")[0] || "Operator",
    organizationName: session.organizationName,
    metrics: [
      { label: "Applications", value: String(applicationsCount.count ?? 0), detail: "All partner applications" },
      { label: "Active partners", value: String(activePartners), detail: "Canonical partner records" },
      { label: "Portal accounts", value: String(linkedAccounts), detail: `${openTasks} open follow-up tasks` },
      { label: "Referrals", value: String(referrals), detail: `${pendingReferrals} awaiting review` }
    ],
    priorityItems,
    recentActivity: activity.slice(0, 5).map(activitySummary),
    sourceBreakdown,
    operatorLifecycle
  };
}
