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

['marketplace', 'training', 'partner-id', 'integrations', 'notes'].forEach((id) => {
  assert.ok(!nav.includes(`id: "${id}"`), `partner MVP navigation must not include ${id}`);
});

assert.ok(html.includes('data-mobile-menu-toggle'), 'mobile menu control is required');
assert.ok(html.includes('data-render-widgets'), 'widgets module target is required');
assert.ok(html.includes('./dashboard/api-client.js'), 'explicit API client loading is required');
assert.ok(html.includes('./dashboard/dashboard-data-adapter.js'), 'explicit data adapter loading is required');
assert.ok(!read('dashboard/dashboard-config.js').includes('document.write'), 'dashboard config must not inject scripts with document.write');

assert.strictEqual(config.AM_I_FUNDABLE_URL, 'https://am-i-fundable.vercel.app/');
assert.strictEqual(config.EMBED_WIDGETS_URL, 'https://embed-widgets-kappa.vercel.app/');
assert.strictEqual(vercel.git.deploymentEnabled.main, false);
assert.strictEqual(vercel.git.deploymentEnabled['*'], false);

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

assert.ok(adapter.includes('Live lead statuses are read-only'), 'live lead status controls must be read-only');
assert.ok(adapter.includes('profileForm.elements'), 'live profile controls must be disabled');

console.log('dashboard-shell tests passed');
