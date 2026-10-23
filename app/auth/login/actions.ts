"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNextPath } from "@/lib/safe-next";

const emailSchema = z.email().max(254);

export async function requestMagicLink(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const nextParam = `&next=${encodeURIComponent(next)}`;
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) redirect(`/auth/login?error=email${nextParam}`);
  if (!isSupabaseConfigured()) redirect(`/auth/login?error=configuration${nextParam}`);
  const origin = process.env.NEXT_PUBLIC_SITE_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", next);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: callbackUrl.toString()
    }
  });
  if (error) redirect(`/auth/login?error=send${nextParam}`);
  redirect(`/auth/login?sent=1${nextParam}`);
}
