export type PartnerResource = {
  id: string;
  title: string;
  category: string;
  description: string;
  href: string;
  audience: string[];
  keywords: string[];
  action: string;
};

// Curated from existing Partner Command routes and the legacy resource inventory.
// Keep this list limited to assets that have a working destination today.
export const partnerResources: PartnerResource[] = [
  {
    id: "funding-readiness",
    title: "Funding readiness checklist",
    category: "Readiness",
    description: "Organize business basics and common documents before a funding conversation.",
    href: "/tools/funding-readiness-checklist.html",
    audience: ["Funding brokers", "Referral partners", "Centers of influence", "Professional service providers"],
    keywords: ["documents", "intake", "checklist", "readiness"],
    action: "Open checklist"
  },
  {
    id: "submit-referral",
    title: "Submit a partner referral",
    category: "Referrals",
    description: "Start a permission-based referral and follow its status from your partner workspace.",
    href: "/dashboard/referrals",
    audience: ["Funding brokers", "Referral partners", "Centers of influence", "Professional service providers"],
    keywords: ["lead", "client", "submit", "status"],
    action: "Open referrals"
  },
  {
    id: "tracking-links",
    title: "Create a tracking link",
    category: "Attribution",
    description: "Manage partner links and preserve campaign attribution for introductions.",
    href: "/dashboard/links",
    audience: ["Affiliate partners", "Referral partners", "Community connectors"],
    keywords: ["campaign", "affiliate", "utm", "share"],
    action: "Manage links"
  },
  {
    id: "permission-based-referrals",
    title: "Permission-based referral rules",
    category: "Compliance",
    description: "Review consent, privacy and truthful positioning before sharing a contact.",
    href: "/compliance#permission",
    audience: ["All partner types"],
    keywords: ["consent", "privacy", "sharing", "compliance"],
    action: "Read the guide"
  },
  {
    id: "affiliate-disclosure",
    title: "Affiliate disclosure guide",
    category: "Marketing",
    description: "Understand how to disclose a partner or compensation relationship in public content.",
    href: "/affiliate-disclosure",
    audience: ["Affiliate partners", "Community connectors"],
    keywords: ["disclosure", "promotion", "content", "compensation"],
    action: "Read the guide"
  },
  {
    id: "sales-script-generator",
    title: "Partner conversation script generator",
    category: "Marketing",
    description: "Draft a truthful introduction or follow-up for human review before sending.",
    href: "/tools/sales-script-generator.html",
    audience: ["Funding brokers", "Affiliate partners", "Referral partners"],
    keywords: ["copy", "email", "introduction", "follow-up"],
    action: "Open the tool"
  },
  {
    id: "crm-integrations",
    title: "CRM integration field map",
    category: "Integrations",
    description: "Review the existing field and event contract for approved CRM connections.",
    href: "/developers/crm-integrations.html",
    audience: ["Funding brokers", "Operators"],
    keywords: ["hubspot", "webhook", "api", "mapping"],
    action: "View the field map"
  },
  {
    id: "program-finder",
    title: "Partner program directory",
    category: "Programs",
    description: "Explore current provider and affiliate records from the connected program registry.",
    href: "/marketplace",
    audience: ["Funding brokers", "Affiliate partners", "Referral partners"],
    keywords: ["funding", "affiliate", "provider", "marketplace"],
    action: "Browse programs"
  }
];
