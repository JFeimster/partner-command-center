"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOperatorSession, requirePartnerSession } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const referralSchema = z.object({
  request_id: z.uuid(),
  business_name: z.string().trim().min(2).max(160),
  contact_name: z.string().trim().min(2).max(160),
  email: z.email().max(254),
  phone: z.string().trim().max(40),
  consent_confirmed: z.literal("on")
});

export async function submitPartnerReferral(formData: FormData) {
  const parsed = referralSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/dashboard/referrals?error=check-details");
  await requirePartnerSession();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("submit_partner_referral", {
    p_request_id: parsed.data.request_id,
    p_business_name: parsed.data.business_name,
    p_contact_name: parsed.data.contact_name,
    p_email: parsed.data.email,
    p_phone: parsed.data.phone,
    p_consent_confirmed: true
  });
  if (error) redirect("/dashboard/referrals?error=save");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/referrals");
  redirect("/dashboard/referrals?submitted=1");
}

const linkSchema = z.object({
  destination_url: z.url().max(2048),
  campaign: z.string().trim().max(80).optional()
});

export async function createPartnerTrackingLink(formData: FormData) {
  const parsed = linkSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/dashboard/links?error=check-link");
  const destination = new URL(parsed.data.destination_url);
  if (destination.protocol !== "https:" || destination.hostname !== "capital.distilledfunding.com") {
    redirect("/dashboard/links?error=destination");
  }
  const session = await requirePartnerSession();
  const supabase = await createServerSupabaseClient();
  const { data: account, error: accountError } = await supabase
    .from("partner_portal_accounts")
    .select("partner_id")
    .eq("organization_id", session.organizationId)
    .eq("user_id", session.userId)
    .eq("status", "active")
    .maybeSingle();
  if (accountError || !account) redirect("/dashboard/links?error=account");
  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("partner_code")
    .eq("organization_id", session.organizationId)
    .eq("id", account.partner_id)
    .maybeSingle();
  if (partnerError || !partner?.partner_code) redirect("/dashboard/links?error=account");
  destination.searchParams.set("ref", partner.partner_code);
  if (parsed.data.campaign) destination.searchParams.set("campaign", parsed.data.campaign);
  const slugBase = `${partner.partner_code}-${parsed.data.campaign || "referral"}`
    .toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 58);
  const slug = `${slugBase}-${randomUUID().replaceAll("-", "").slice(0, 8)}`;
  const { error } = await supabase.rpc("create_partner_tracking_link", {
    p_slug: slug,
    p_destination_url: destination.toString(),
    p_campaign: parsed.data.campaign ?? ""
  });
  if (error) redirect("/dashboard/links?error=save");
  revalidatePath("/dashboard/links");
  revalidatePath("/dashboard");
  redirect("/dashboard/links?created=1");
}

const applicationIdSchema = z.uuid();
const allowedTriageStatuses = ["needs_review", "qualified", "onboarding", "nurture"] as const;

export async function reviewPartnerApplication(applicationId: string, status: string) {
  const parsedId = applicationIdSchema.safeParse(applicationId);
  if (!parsedId.success || !allowedTriageStatuses.includes(status as typeof allowedTriageStatuses[number])) {
    throw new Error("Invalid application triage request");
  }
  await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("triage_partner_application", {
    p_application_id: parsedId.data,
    p_status: status
  });
  if (error) throw new Error("The application could not be updated");
  revalidatePath("/operator/applications");
  revalidatePath(`/operator/applications/${parsedId.data}`);
  revalidatePath("/operator");
}

export async function approvePartnerApplication(applicationId: string) {
  const parsedId = applicationIdSchema.safeParse(applicationId);
  if (!parsedId.success) throw new Error("Invalid application approval request");
  await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const { data: partnerId, error } = await supabase.rpc("approve_partner_application", {
    p_application_id: parsedId.data
  });
  if (error || !partnerId) redirect(`/operator/applications/${parsedId.data}?error=approve`);
  revalidatePath("/operator/applications");
  revalidatePath(`/operator/applications/${parsedId.data}`);
  revalidatePath(`/operator/partners/${partnerId}`);
  revalidatePath("/operator/partners");
  revalidatePath("/operator/tasks");
  revalidatePath("/operator");
  redirect(`/operator/applications/${parsedId.data}?approved=1`);
}

export async function declinePartnerApplication(applicationId: string, formData: FormData) {
  const parsedId = applicationIdSchema.safeParse(applicationId);
  const parsed = z.object({ reason: z.string().trim().min(3).max(500) }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsedId.success || !parsed.success) redirect(`/operator/applications/${applicationId}?error=reason`);
  await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("decline_partner_application", {
    p_application_id: parsedId.data,
    p_reason: parsed.data.reason
  });
  if (error) redirect(`/operator/applications/${parsedId.data}?error=decline`);
  revalidatePath("/operator/applications");
  revalidatePath(`/operator/applications/${parsedId.data}`);
  revalidatePath("/operator");
  redirect(`/operator/applications/${parsedId.data}?declined=1`);
}

export async function updatePartnerReferralStatus(referralId: string, status: string) {
  const parsedId = applicationIdSchema.safeParse(referralId);
  if (!parsedId.success || !["accepted", "qualified", "converted", "rejected"].includes(status)) {
    throw new Error("Invalid referral status update");
  }
  await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("update_partner_referral_status", {
    p_referral_id: parsedId.data,
    p_status: status
  });
  if (error) redirect(`/operator/referrals/${parsedId.data}?error=transition`);
  revalidatePath("/operator/referrals");
  revalidatePath(`/operator/referrals/${parsedId.data}`);
  revalidatePath("/operator");
  revalidatePath("/dashboard/referrals");
  revalidatePath("/dashboard/activity");
  redirect(`/operator/referrals/${parsedId.data}?updated=1`);
}

export async function completePartnerTask(taskId: string) {
  const parsedId = applicationIdSchema.safeParse(taskId);
  if (!parsedId.success) throw new Error("Invalid task request");
  await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("complete_partner_follow_up", { p_task_id: parsedId.data });
  if (error) throw new Error("The task could not be completed");
  revalidatePath("/operator/tasks");
  revalidatePath("/operator/applications");
  revalidatePath("/operator/partners");
  revalidatePath("/operator");
}

const partnerTaskSchema = z.object({
  task_id: z.uuid(),
  title: z.string().trim().min(3).max(160),
  notes: z.string().trim().max(2000),
  due_date: z.union([z.literal(""), z.iso.date()]),
  application_id: z.union([z.literal(""), z.uuid()]),
  partner_id: z.union([z.literal(""), z.uuid()])
});

export async function createPartnerFollowUpTask(formData: FormData) {
  const parsed = partnerTaskSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/operator/tasks?error=check-details");
  const session = await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_partner_follow_up_task", {
    p_organization_id: session.organizationId,
    p_task_id: parsed.data.task_id,
    p_title: parsed.data.title,
    p_notes: parsed.data.notes || null,
    p_due_at: parsed.data.due_date ? new Date(`${parsed.data.due_date}T12:00:00.000Z`).toISOString() : null,
    p_application_id: parsed.data.application_id || null,
    p_partner_id: parsed.data.partner_id || null
  });
  if (error) redirect("/operator/tasks?error=create");
  revalidatePath("/operator/tasks");
  revalidatePath("/operator/applications");
  revalidatePath("/operator/partners");
  revalidatePath("/operator");
  redirect("/operator/tasks?created=1");
}

export async function claimPartnerPortalAccess() {
  const supabase = await createServerSupabaseClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) redirect("/auth/login");
  const { error } = await supabase.rpc("claim_partner_portal_access");
  if (error) redirect("/auth/no-access?claim=unavailable");
  redirect("/dashboard/onboarding");
}

const profileSchema = z.object({
  phone: z.string().trim().max(40),
  website_url: z.union([z.literal(""), z.url().max(256)]),
  service_area: z.string().trim().max(120),
  business_summary: z.string().trim().max(500)
});

export async function updatePartnerProfile(formData: FormData) {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/dashboard/profile?error=details");
  if (parsed.data.website_url && new URL(parsed.data.website_url).protocol !== "https:") {
    redirect("/dashboard/profile?error=website");
  }
  await requirePartnerSession();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("update_partner_portal_profile", {
    p_phone: parsed.data.phone,
    p_website_url: parsed.data.website_url,
    p_service_area: parsed.data.service_area,
    p_business_summary: parsed.data.business_summary
  });
  if (error) redirect("/dashboard/profile?error=save");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/onboarding");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/activity");
  redirect("/dashboard/profile?saved=1");
}

const partnerClassificationSchema = z.object({
  partner_id: z.uuid(),
  status: z.enum(["pending", "active", "paused", "terminated"]),
  partner_type: z.enum([
    "funding_broker", "referral_partner", "affiliate_partner", "center_of_influence",
    "professional_service_provider", "community_connector", "internal_operator", "unknown"
  ])
});

export async function updatePartnerClassification(formData: FormData) {
  const parsed = partnerClassificationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error("Select a valid partner status and partner type");
  await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("update_partner_operational_fields", {
    p_partner_id: parsed.data.partner_id,
    p_status: parsed.data.status,
    p_partner_type: parsed.data.partner_type
  });
  if (error) redirect(`/operator/partners/${parsed.data.partner_id}?error=save`);
  revalidatePath("/operator/partners");
  revalidatePath(`/operator/partners/${parsed.data.partner_id}`);
  revalidatePath("/operator");
  redirect(`/operator/partners/${parsed.data.partner_id}?saved=1`);
}
