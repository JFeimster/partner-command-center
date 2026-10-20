import type { Metadata } from "next";
import Link from "next/link";
import { requestMagicLink } from "./actions";

export const metadata: Metadata = { title: "Sign in | Partner Command", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string; reason?: string }> }) {
  const params = await searchParams;
  const notice = params.sent
    ? "If this address has access, a sign-in link is on its way."
    : params.error === "configuration" || params.reason === "configuration"
      ? "Sign-in is being configured. Please contact your operator."
      : params.error
        ? "We could not send a sign-in link. Check the address and try again."
        : "Use the email address connected to your approved partner account.";
  return (
    <main className="min-h-screen bg-[#0a1420] px-6 py-16 text-white">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9fe0d3]">Moonshine Capital</Link>
        <p className="mt-14 text-xs font-semibold uppercase tracking-[0.25em] text-[#9fe0d3]">Partner Command</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-4 text-base leading-7 text-slate-300">{notice}</p>
        <form action={requestMagicLink} className="mt-10 space-y-5">
          <label htmlFor="email" className="block text-sm font-medium text-slate-200">Work email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-[#9fe0d3]" placeholder="name@company.com" />
          <button className="w-full rounded-lg bg-[#9fe0d3] px-5 py-3 font-semibold text-[#0a1420] transition hover:bg-white" type="submit">Send sign-in link</button>
        </form>
        <p className="mt-8 text-sm text-slate-400">Approved partners can claim access after signing in with the verified contact email on their active partner record. New accounts cannot see partner data until that record matches.</p>
      </div>
    </main>
  );
}
