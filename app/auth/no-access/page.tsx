import Link from "next/link";
import { claimPartnerPortalAccess } from "@/lib/actions";

export default async function NoAccessPage({ searchParams }: { searchParams: Promise<{ claim?: string }> }) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[#0a1420] px-6 text-white">
      <div className="max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9fe0d3]">Partner Command</p>
        <h1 className="mt-4 text-3xl font-semibold">Access needs review</h1>
        <p className="mt-4 leading-7 text-slate-300">Your sign-in worked, but this account does not yet have portal access. If your approved partner record uses this verified email, link it below. Otherwise, ask your program operator to review access.</p>
        {params.claim && <p className="mt-4 rounded border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">No eligible partner record matched this email, or operator review is needed.</p>}
        <form action={claimPartnerPortalAccess} className="mt-8"><button className="rounded-lg bg-[#9fe0d3] px-5 py-3 font-semibold text-[#0a1420]" type="submit">Link approved partner account</button></form>
        <Link className="mt-8 inline-block text-[#9fe0d3] underline" href="/auth/logout">Sign out</Link>
      </div>
    </main>
  );
}
