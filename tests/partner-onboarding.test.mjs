import test from "node:test";
import assert from "node:assert/strict";
import { buildOnboardingSteps, onboardingProgress } from "../lib/partner-onboarding.ts";

test("onboarding reflects only completed persisted actions", () => {
  const steps = buildOnboardingSteps({
    linked: true,
    phone: "",
    websiteUrl: "",
    serviceArea: "",
    linkCount: 0,
    referralCount: 0
  });
  assert.deepEqual(steps.map((step) => step.complete), [true, false, false, false]);
  assert.deepEqual(onboardingProgress(steps), { completed: 1, total: 4 });
});

test("profile requires contact phone and business context", () => {
  const steps = buildOnboardingSteps({
    linked: true,
    phone: "555-0100",
    websiteUrl: "",
    serviceArea: "Northeast",
    linkCount: 2,
    referralCount: 0
  });
  assert.deepEqual(steps.map((step) => step.complete), [true, true, true, false]);
  assert.equal(steps.find((step) => !step.complete)?.href, "/dashboard/referrals");
});

test("unlinked accounts cannot appear onboarded", () => {
  const steps = buildOnboardingSteps({
    linked: false,
    phone: "555-0100",
    websiteUrl: "https://example.com",
    serviceArea: "",
    linkCount: 1,
    referralCount: 1
  });
  assert.equal(onboardingProgress(steps).completed, 0);
});
