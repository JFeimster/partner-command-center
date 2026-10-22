import type { Metadata } from "next";
import { PublicInterior } from "@/components/public-interior";
import { ProgramDirectory } from "@/components/program-directory";
import { getPrograms } from "@/lib/program-catalog";

export const metadata: Metadata = { title: "Partner programs", description: "Browse current funding and affiliate program records by category and use case." };
export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  let programs = [] as Awaited<ReturnType<typeof getPrograms>>;
  let unavailable = false;
  try { programs = await getPrograms(); } catch { unavailable = true; }
  return <PublicInterior eyebrow="MARKETPLACE / PROGRAMS" title="Find the right conversation." intro="Search current program records by category, use case, and product. Partner access and funding outcomes always require review.">
    {unavailable ? <section className="catalog-empty" role="status"><h2>Program directory is temporarily unavailable</h2><p>Use the funding readiness tools while the registry reconnects.</p><a href="/resources">Open resources</a></section> : programs.length ? <ProgramDirectory programs={programs}/> : <section className="catalog-empty"><h2>No programs are ready to display</h2><p>Explore readiness resources or request partner access for current opportunities.</p><a href="/resources">Open resources</a></section>}
    <p className="interior-footnote">Registry entries are program discovery information. They do not establish lender eligibility, available terms, approval, funding, or compensation.</p>
  </PublicInterior>;
}
