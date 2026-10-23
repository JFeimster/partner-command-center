import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { partnerTypeToResourceAudience } = require("../lib/resource-audience.ts");

test("resource recommendations use only recognized canonical partner types", () => {
  assert.equal(partnerTypeToResourceAudience("funding_broker"), "Funding brokers");
  assert.equal(partnerTypeToResourceAudience("professional_service_provider"), "Professional service providers");
  assert.equal(partnerTypeToResourceAudience("internal_operator"), "Operators");
  assert.equal(partnerTypeToResourceAudience("unknown"), null);
  assert.equal(partnerTypeToResourceAudience(null), null);
});
