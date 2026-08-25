'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function read(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

const html = read('dashboard.html');
const nav = read('data/dashboard-nav.js');
const config = JSON.parse(read('data/app-config.json'));
const vercel = JSON.parse(read('vercel.json'));
const adapter = read('dashboard/dashboard-data-adapter.js');

const modules = ['overview', 'leads', 'links', 'resources', 'widgets', 'commissions', 'settings'];
modules.forEach((id) => {
  assert.ok(html.includes(`id="${id}"`), `dashboard.html must include #${id}`);
  assert.ok(nav.includes(`id: "${id}"`), `dashboard navigation must include ${id}`);
});

['training', 'partner-id', 'integrations', 'notes'].forEach((id) => {
  assert.ok(!nav.includes(`id: "${id}"`), `partner MVP navigation must not include ${id}`);
});

assert.ok(html.includes('data-mobile-menu-toggle'), 'mobile menu control is required');
assert.ok(html.includes('data-render-widgets'), 'widgets module target is required');
assert.ok(html.includes('data-render-lead-queue'), 'lead queue module target is required');
assert.ok(html.includes('data-render-client-workspace'), 'client workspace module target is required');
assert.ok(html.includes('data-render-follow-up-queue'), 'follow-up queue module target is required');
assert.ok(nav.includes('id: "capital"'), 'Capital Product Desk navigation is required');
assert.ok(nav.includes('id: "providers"'), 'Capital Providers navigation is required');
assert.ok(nav.includes('id: "marketplace"'), 'Capital Marketplace navigation is required');
assert.ok(nav.includes('id: "assets"'), 'Growth Marketing Assets navigation is required');
assert.ok(nav.includes('href: "./growth.html#assets"'), 'Growth Marketing Assets must use its implemented anchor');
assert.ok(nav.includes('id: "build"'), 'Build navigation is required');
assert.ok(nav.includes('id: "tools"'), 'Tools navigation is required');
assert.ok(nav.includes('id: "ai"'), 'AI navigation is required');
assert.ok(nav.includes('id: "calculators"'), 'Calculators navigation is required');
assert.ok(nav.includes('id: "learn"'), 'Learn navigation is required');
assert.ok(nav.includes('id: "sprint"'), '30-Day Sprint navigation is required');
assert.ok(nav.includes('id: "scripts"'), 'Scripts navigation is required');
assert.ok(nav.includes('id: "events"'), 'Events navigation is required');
assert.ok(nav.includes('id: "earn"'), 'Earn navigation is required');
assert.ok(nav.includes('id: "production"'), 'Production navigation is required');
assert.ok(nav.includes('id: "team"'), 'Team navigation is required');
assert.ok(nav.includes('id: "game-plans"'), 'Game Plans navigation is required');
assert.ok(nav.includes('id: "leadership"'), 'Leadership navigation is required');
assert.ok(nav.includes('id: "account"'), 'Account Profile navigation is required');
assert.ok(nav.includes('id: "compliance"'), 'Account Compliance navigation is required');
assert.ok(html.includes('./dashboard/api-client.js'), 'explicit API client loading is required');
assert.ok(html.includes('./dashboard/dashboard-data-adapter.js'), 'explicit data adapter loading is required');
assert.ok(!read('dashboard/dashboard-config.js').includes('document.write'), 'dashboard config must not inject scripts with document.write');

assert.strictEqual(config.AM_I_FUNDABLE_URL, 'https://am-i-fundable.vercel.app/');
assert.strictEqual(config.EMBED_WIDGETS_URL, 'https://embed-widgets-kappa.vercel.app/');
assert.strictEqual(vercel.git.deploymentEnabled, false, 'all automatic Vercel deployments must be disabled');

[
  'getDashboardPayload',
  'getPartnerProfile',
  'getTrackingLinks',
  'getLeadSummaries',
  'getFundingReadinessLeads',
  'getReviewQueue',
  'getResources',
  'getWidgets',
  'getEvents',
  'getAlerts',
  'getRecommendedNextActions'
].forEach((method) => assert.ok(adapter.includes(`${method}:`), `adapter must expose ${method}`));

assert.ok(adapter.includes('Lead statuses are read-only in partner live mode.'), 'live lead status controls must be read-only');
assert.ok(adapter.includes('profileForm.elements'), 'live profile controls must be disabled');

console.log('dashboard-shell tests passed');
