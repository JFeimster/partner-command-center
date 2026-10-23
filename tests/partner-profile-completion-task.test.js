"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const migration = fs.readFileSync(path.join(__dirname, "..", "supabase", "migrations", "20261023051642_partner_profile_completion_task_automation.sql"), "utf8");

test("profile follow-up automation is limited to verified real partner claims", () => {
  assert.match(migration, /a\.created_by = a\.user_id/);
  assert.match(migration, /u\.email_confirmed_at is not null/);
  assert.match(migration, /lower\(btrim\(u\.email\)\) = lower\(btrim\(v_partner\.contact_email\)\)/);
  assert.match(migration, /coalesce\(v_partner\.metadata->>'fictional', 'false'\) = 'true'/);
});

test("profile follow-up creation, automatic resolution, and reopening are idempotent and audited", () => {
  assert.match(migration, /md5\('partner-profile-completion:' \|\| v_partner\.id::text\)::uuid/);
  assert.match(migration, /'Complete partner business profile'/);
  assert.match(migration, /now\(\) \+ interval '3 days'/);
  assert.match(migration, /set status = 'completed', updated_at = now\(\)/);
  assert.match(migration, /set status = 'open', due_at = now\(\) \+ interval '3 days'/);
  assert.match(migration, /partner_command_automation/);
  assert.match(migration, /partner_profile_completion_v1/);
  assert.match(migration, /from public, anon, authenticated/);
});
