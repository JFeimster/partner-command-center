import { z } from "zod";

const channel = z.enum(["Email", "LinkedIn", "SMS", "Phone", "Social posts", "Referral introductions", "Educational events"]);
const objective = z.enum(["Acquire business-owner conversations", "Develop professional referral relationships", "Promote an educational resource", "Re-engage existing contacts", "Recruit prospective funding agents"]);
const allowedResources = [
  { id: "funding-guide", title: "Public funding information", url: "https://www.distilledfunding.com/lending" },
  { id: "partner-education", title: "Partner education", url: "https://www.distilledfunding.com/partners" },
  { id: "discovery-workbench", title: "Funding Discovery Workbench", url: "/toolkit/discovery" },
  { id: "field-academy", title: "Agent Field Academy", url: "/toolkit/academy" },
  { id: "first-30-days", title: "First 30 days plan", url: "/start" },
  { id: "public-tools", title: "Public funding tools", url: "https://tools.distilledfunding.com" }
];
const config = z.object({
  audience: z.string().max(120), objective, channels: z.array(channel).max(7),
  structure: z.enum(["Single-touch outreach", "Three-touch sequence", "Five-touch sequence", "Educational nurture sequence", "Referral introduction sequence"]),
  context: z.string().max(500), agentName: z.string().max(120), businessName: z.string().max(120), professionId: z.string().max(120),
  resourceIds: z.array(z.string().refine((id) => allowedResources.some((resource) => resource.id === id))).max(allowedResources.length), layout: z.enum(["Professional", "Bold", "Minimal"]),
  hours: z.number().min(0).max(1000), sessions: z.number().min(0).max(1000), conversations: z.number().min(0).max(1000),
  followUps: z.number().min(0).max(1000), relationships: z.number().min(0).max(1000), durationWeeks: z.number().min(0).max(1000),
  mode: z.enum(["Part-time agent", "Consistent weekly operator", "Full-time agency builder"])
}).strict();
const resource = z.object({ id: z.string().max(80), title: z.string().max(200), url: z.string().max(2048) }).strict().refine((value) => {
  const approved = allowedResources.find((item) => item.id === value.id);
  if (!approved || value.title !== approved.title) return false;
  try { return new URL(value.url, "https://moonshine-broker.vercel.app").href === new URL(approved.url, "https://moonshine-broker.vercel.app").href; }
  catch { return false; }
});

export const campaignHandoffSchema = z.object({
  schema: z.literal("moonshine.agency.campaign"), version: z.literal(1),
  campaign: z.object({
    config,
    name: z.string().max(300), objective: z.string().max(300), audience: z.string().max(300), channels: z.array(channel).max(7),
    sequence: z.array(z.object({ step: z.number().int().min(1).max(12), channel: z.string().max(80), interval: z.string().max(120), body: z.string().max(6000) }).strict()).max(12),
    resources: z.array(resource).max(allowedResources.length),
    assets: z.object({ outreach: z.string().max(40_000), referralKit: z.string().max(40_000), marketing: z.string().max(40_000), activityPlan: z.string().max(40_000) }).strict()
}).strict().refine((value) => value.config.resourceIds.length === value.resources.length && value.config.resourceIds.every((id) => value.resources.some((item) => item.id === id))).refine((value) => value.objective === value.config.objective && value.channels.length === value.config.channels.length && value.channels.every((channel, index) => channel === value.config.channels[index])),
  attribution: z.object({ status: z.literal("unassigned") }).strict()
}).strict();

export type CampaignHandoff = z.infer<typeof campaignHandoffSchema>;
export const campaignHandoffMaxBytes = 256_000;

export function parseCampaignHandoff(text: string): CampaignHandoff | null {
  if (new TextEncoder().encode(text).byteLength > campaignHandoffMaxBytes) return null;
  try {
    const result = campaignHandoffSchema.safeParse(JSON.parse(text));
    return result.success ? result.data : null;
  } catch { return null; }
}
