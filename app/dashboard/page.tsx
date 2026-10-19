import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Metadata } from "next";
import { LegacyScripts } from "../legacy-scripts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Partner Dashboard | Moonshine Partner Command Center",
  description:
    "Partner workspace for leads, tracking links, resources, widgets, commissions, and account settings.",
};

export default async function DashboardPage() {
  const source = await readFile(join(process.cwd(), "dashboard.html"), "utf8");
  const body = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  if (!body) throw new Error("The existing dashboard page has no body markup.");

  const scripts = Array.from(
    body.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi),
  )
    .map((match) => match[1])
    .filter((path) => path.startsWith("./"))
    .map((path) => path.replace(/^\.\//, "/"));
  const markup = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  return (
    <div className="dashboard-body">
      <div dangerouslySetInnerHTML={{ __html: markup }} />
      <LegacyScripts paths={scripts} />
    </div>
  );
}
