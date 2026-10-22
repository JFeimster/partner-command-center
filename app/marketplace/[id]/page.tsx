import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { PublicInterior } from "@/components/public-interior";
import { getProgram, getPrograms } from "@/lib/program-catalog";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const program = await getProgram((await params).id).catch(() => null);
  return { title: program?.name || "Program", description: program?.description || "Current program information and partner referral actions." };
}

export default async function ProgramPage({ params }: Props) {
  const program = await getProgram((await params).id).catch(() => null);
  if (!program) notFound();
  const related = (await getPrograms().catch(() => [])).filter((item) => item.id !== program.id && item.category.some((category) => program.category.includes(category))).slice(0, 3);
  return <PublicInterior eyebrow={`PROGRAM / ${program.category.join(" / ") || "DISCOVERY"}`} title={program.name} intro={program.description || "Explore the current source record and approved next actions."}>
    <div className="program-detail"><section><span className="eyebrow">SOURCE DETAILS</span><h2>Where this program may fit</h2>{program.useCases.length ? <p>{program.useCases.join(" · ")}</p> : <p>Ask an operator about the current use cases before recommending this program.</p>}{program.industries.length > 0 && <><h3>Industries listed</h3><p>{program.industries.join(" · ")}</p></>}{program.products.length > 0 && <><h3>Products listed</h3><p>{program.products.join(" · ")}</p></>}</section><aside><span className="eyebrow">NEXT ACTION</span><h2>Make a responsible introduction</h2><p>Approved partners can create an attributed Moonshine referral link or submit a referral from their workspace. Provider destinations and terms require operator confirmation.</p><Link className="button button--yellow" href="/dashboard/links">Create a partner link <ArrowUpRight size={18}/></Link><Link className="program-secondary-link" href="/dashboard/referrals">Submit a referral <ArrowUpRight size={16}/></Link>{program.website && <a className="program-secondary-link" href={program.website} target="_blank" rel="noopener noreferrer">Visit provider website <ArrowUpRight size={16}/></a>}</aside></div>
    {related.length > 0 && <section className="program-related"><span className="eyebrow">RELATED PROGRAMS</span><div className="directory-list">{related.map((item) => <article className="directory-row" key={item.id}><span className="directory-row__number">↗</span><div><span className="directory-row__type">{item.category.join(" / ")}</span><h3>{item.name}</h3></div><p>{item.description}</p><Link href={`/marketplace/${item.id}`} aria-label={`View ${item.name}`}><ArrowUpRight size={20}/></Link></article>)}</div></section>}
    <p className="interior-footnote">Program records describe possible paths. They are not funding offers, approval criteria, or confirmed partner compensation. Obtain consent before submitting a referral.</p>
  </PublicInterior>;
}
