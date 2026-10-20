export type OnboardingInput = {
  linked: boolean;
  phone: string;
  websiteUrl: string;
  serviceArea: string;
  linkCount: number;
  referralCount: number;
};

export type OnboardingStep = {
  id: string;
  title: string;
  detail: string;
  href: string;
  complete: boolean;
};

export function buildOnboardingSteps(input: OnboardingInput): OnboardingStep[] {
  const profileComplete = Boolean(input.phone.trim() && (input.websiteUrl.trim() || input.serviceArea.trim()));
  return [
    { id: "access", title: "Claim your partner account", detail: "Connect your verified email to the approved partner record.", href: "/auth/no-access", complete: input.linked },
    { id: "profile", title: "Complete business details", detail: "Add a contact phone and website or service area.", href: "/dashboard/profile", complete: input.linked && profileComplete },
    { id: "link", title: "Create an attribution link", detail: "Build a trackable link for an approved destination.", href: "/dashboard/links", complete: input.linked && input.linkCount > 0 },
    { id: "referral", title: "Submit your first referral", detail: "Introduce a business after obtaining contact permission.", href: "/dashboard/referrals", complete: input.linked && input.referralCount > 0 }
  ];
}

export function onboardingProgress(steps: OnboardingStep[]) {
  return { completed: steps.filter((step) => step.complete).length, total: steps.length };
}
