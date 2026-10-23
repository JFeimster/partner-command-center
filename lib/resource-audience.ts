const PARTNER_AUDIENCES: Record<string, string> = {
  funding_broker: "Funding brokers",
  referral_partner: "Referral partners",
  affiliate_partner: "Affiliate partners",
  center_of_influence: "Centers of influence",
  professional_service_provider: "Professional service providers",
  community_connector: "Community connectors",
  internal_operator: "Operators"
};

export function partnerTypeToResourceAudience(partnerType: string | null | undefined) {
  return partnerType ? PARTNER_AUDIENCES[partnerType] ?? null : null;
}
