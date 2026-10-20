import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type PortalSession = {
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: string;
};

export async function requirePartnerSession(): Promise<PortalSession> {
  if (!isSupabaseConfigured()) redirect("/auth/login?reason=configuration");
  const supabase = await createServerSupabaseClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) redirect("/auth/login");

  const { data: memberships, error: membershipError } = await supabase
    .from("memberships")
    .select("organization_id,role_id,status")
    .eq("user_id", auth.user.id)
    .eq("status", "active")
    .limit(10);
  if (membershipError || !memberships?.length) redirect("/auth/no-access");

  for (const membership of memberships) {
    const [{ data: role }, { data: organization }] = await Promise.all([
      supabase.from("roles").select("key").eq("id", membership.role_id).maybeSingle(),
      supabase.from("organizations").select("name,status").eq("id", membership.organization_id).maybeSingle()
    ]);
    if (organization?.status !== "active" || !role?.key) continue;
    if (!["partner_portal", "partner", "operator", "admin", "owner"].includes(role.key)) continue;
    return {
      userId: auth.user.id,
      email: auth.user.email ?? "",
      organizationId: membership.organization_id,
      organizationName: organization.name,
      role: role.key
    };
  }
  redirect("/auth/no-access");
}

export async function requireOperatorSession(): Promise<PortalSession> {
  const session = await requirePartnerSession();
  if (!["operator", "admin", "owner"].includes(session.role)) redirect("/auth/no-access");
  return session;
}
