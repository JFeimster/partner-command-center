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

export async function reviewPartnerApplication(applicationId: string, status: string, _formData?: FormData) {
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
  revalidatePath("/operator");
}

export async function completePartnerTask(taskId: string, _formData?: FormData) {
  const parsedId = applicationIdSchema.safeParse(taskId);
  if (!parsedId.success) throw new Error("Invalid task request");
  await requireOperatorSession();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("complete_partner_follow_up", { p_task_id: parsedId.data });
  if (error) throw new Error("The task could not be completed");
  revalidatePath("/operator/tasks");
  revalidatePath("/operator");
}

export async function claimPartnerPortalAccess() {
  const supabase = await createServerSupabaseClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) redirect("/auth/login");
  const { error } = await supabase.rpc("claim_partner_portal_access");
  if (error) redirect("/auth/no-access?claim=unavailable");
  redirect("/dashboard");
}
