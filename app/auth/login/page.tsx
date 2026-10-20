import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { requestMagicLink } from "./actions";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string; reason?: string }> }) {
  const params = await searchParams;
  const notice = params.sent
    ? "If this address has access, a sign-in link is on its way."
    : params.error === "configuration" || params.reason === "configuration"
      ? "Sign-in is being configured. Please contact your operator."
      : params.error
        ? "We could not send a sign-in link. Check the address and try again."
        : "Use the verified email address on your approved partner record.";
  return <AuthShell eyebrow="SECURE PARTNER ACCESS" title="Sign in to Command"><p className="auth-shell__intro" role={params.error ? "alert" : params.sent ? "status" : undefined}>{notice}</p><form action={requestMagicLink} className="auth-form"><label htmlFor="email">Work email</label><input id="email" name="email" type="email" required autoComplete="email" placeholder="name@company.com" /><button type="submit">Send sign-in link <span aria-hidden="true">↗</span></button></form><p className="auth-shell__note">After sign-in, approved partners can claim access when this email exactly matches their active partner record. New accounts cannot view partner data until then.</p></AuthShell>;
}
