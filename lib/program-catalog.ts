import "server-only";

type NotionProperty = { type?: string; title?: { plain_text?: string }[]; rich_text?: { plain_text?: string }[]; select?: { name?: string }; status?: { name?: string }; multi_select?: { name?: string }[]; url?: string | null; checkbox?: boolean };
type NotionPage = { id: string; properties?: Record<string, NotionProperty> };
const CANONICAL_PROVIDER_SOURCE = "1c54bc1b-d63c-801f-946c-000bd9dd59b5";

export type Program = {
  id: string;
  name: string;
  category: string[];
  description: string;
  useCases: string[];
  industries: string[];
  products: string[];
  website: string | null;
};

function propertyText(property?: NotionProperty) {
  if (!property) return "";
  return property.title?.map((part) => part.plain_text || "").join("") || property.rich_text?.map((part) => part.plain_text || "").join("") || property.select?.name || "";
}

function propertyList(property?: NotionProperty) {
  return property?.multi_select?.map((item) => item.name || "").filter(Boolean) || (propertyText(property) ? [propertyText(property)] : []);
}

function safeWebsite(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
}

function mapProgram(page: NotionPage): Program | null {
  const fields = page.properties || {};
  if ((fields["Affiliate Status"]?.select?.name || fields["Affiliate Status"]?.status?.name) !== "Active") return null;
  const name = propertyText(fields["Affiliate/Lender Name"]).trim();
  if (!name) return null;
  return {
    id: page.id,
    name,
    category: propertyList(fields.Category),
    description: propertyText(fields.Description).trim(),
    useCases: propertyList(fields["Use Case (Variant)"]),
    industries: propertyList(fields["Target Industries (Variant)"]),
    products: propertyList(fields["Financing Options Available"]),
    website: safeWebsite(fields.DomainURL?.url)
  };
}

async function queryPrograms(sourceOverride?: string): Promise<NotionPage[]> {
  const token = process.env.NOTION_API_KEY;
  const source = (sourceOverride || process.env.NOTION_FUNDING_PROVIDERS_DATA_SOURCE_ID)?.replace(/^collection:\/\//, "");
  if (!token || !source || !/^[0-9a-f-]{32,36}$/i.test(source)) return [];
  const pages: NotionPage[] = [];
  let cursor: string | undefined;
  for (let batch = 0; batch < 3; batch += 1) {
    const response = await fetch(`https://api.notion.com/v1/data_sources/${source}/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2026-03-11", "Content-Type": "application/json" },
      // Keep the Notion query broad: registry property types have changed across
      // imported databases. The canonical status allowlist is enforced by
      // mapProgram below, where inactive records are excluded consistently.
      body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
      next: { revalidate: 900 }
    });
    if (!response.ok) throw new Error(`Program registry unavailable (${response.status})`);
    const data = await response.json() as { results?: NotionPage[]; has_more?: boolean; next_cursor?: string | null };
    pages.push(...(data.results || []));
    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor;
  }
  return pages;
}

export async function getPrograms(): Promise<Program[]> {
  const configuredSource = process.env.NOTION_FUNDING_PROVIDERS_DATA_SOURCE_ID?.replace(/^collection:\/\//, "");
  const primaryPages = await queryPrograms();
  const primary = primaryPages.map(mapProgram).filter((program): program is Program => program !== null);
  // Older deployments may retain a stale source ID after the Notion registry was
  // split into a dedicated data source. Fall back only when that source has no
  // active records, and keep the same server-side Active allowlist on both reads.
  const fallbackPages = !primary.length && configuredSource && configuredSource !== CANONICAL_PROVIDER_SOURCE
    ? await queryPrograms(CANONICAL_PROVIDER_SOURCE)
    : [];
  const fallback = fallbackPages.map(mapProgram).filter((program): program is Program => program !== null);
  const programs = primary.length ? primary : fallback;
  if (!programs.length) {
    const pages = primaryPages.length ? primaryPages : fallbackPages;
    const statusCounts = pages.reduce<Record<string, number>>((counts, page) => {
      const status = page.properties?.["Affiliate Status"];
      const name = status?.select?.name || status?.status?.name || (status?.type ? `type:${status.type}` : "missing");
      counts[name] = (counts[name] || 0) + 1;
      return counts;
    }, {});
    console.warn("Marketplace registry returned no active programs", {
      tokenConfigured: Boolean(process.env.NOTION_API_KEY),
      sourceConfigured: Boolean(configuredSource),
      sourceIsCanonical: configuredSource === CANONICAL_PROVIDER_SOURCE,
      pageCount: pages.length,
      propertyNames: Object.keys(pages[0]?.properties || {}),
      statusCounts
    });
  }
  return programs.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProgram(id: string): Promise<Program | null> {
  if (!/^[0-9a-f-]{32,36}$/i.test(id)) return null;
  return (await getPrograms()).find((program) => program.id === id) || null;
}
