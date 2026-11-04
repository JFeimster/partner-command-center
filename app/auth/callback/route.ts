import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-next";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const safeNext = safeNextPath(request.nextUrl.searchParams.get("next"));
  if (!code) return NextResponse.redirect(new URL("/auth/login?error=callback", request.url));
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/auth/login?error=callback", request.url));
  // Claiming is performed by the canonical verified-email RPC. It checks
  // email_confirmed_at, organization scope, active partner status, and conflicts;
  // no user-editable metadata is used for authorization.
  const { error: claimError } = await supabase.rpc("claim_partner_portal_access");
  if (!claimError) return NextResponse.redirect(new URL("/dashboard/onboarding", request.url));
  return NextResponse.redirect(new URL(`/auth/no-access?claim=unavailable&next=${encodeURIComponent(safeNext)}`, request.url));
}
