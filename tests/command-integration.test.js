'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('dashboard.html');
const controller = read('dashboard.js');
const nav = read('data/dashboard-nav.js');

function priorityFor(state) {
  const window = { MoonshineOS: { dashboard: { state: { getState: () => state }, partnerStore: { getProfile: () => state.partnerProfile || {} }, seedData: { trainingModules: [{ id: 'orientation', title: 'Partner Orientation', summary: 'Learn the workspace.' }] } } } };
  const document = { readyState: 'loading', addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; } };
  vm.runInNewContext(read('dashboard.js'), { window, document });
  return window.MoonshineOS.dashboard.controller.getCommandPriority();
}

test('Command renders a single orchestration priority surface', () => {
  assert.match(html, /data-render-command-priority/);
  assert.match(controller, /getCommandPriority/);
  assert.match(controller, /renderCommandPriority/);
  assert.match(html, /Needs attention/);
  assert.match(html, /Command priority/);
  assert.doesNotMatch(html, /data-render-next-actions|Next recommended actions/);
});

test('Command priority is deterministic and pipeline-first', () => {
  const items = priorityFor({
    partnerProfile: { partnerId: 'MS-DEMO-0000', company: 'Demo Co', contactName: 'Demo' },
    leads: [
      { businessName: 'New Client', status: 'new' },
      { businessName: 'Docs Client', status: 'needsInfo', documentStatus: 'requested' },
      { businessName: 'Overdue Client', status: 'reviewing', followUpAt: '2020-01-01T00:00:00.000Z', nextStep: 'Call owner' }
    ],
    trainingProgress: {}
  });
  assert.equal(items[0].label, 'Overdue follow-up: Overdue Client');
  assert.equal(items[0].href, '#leads');
  assert.equal(items[1].label, 'Waiting on client: Docs Client');
});

test('Command does not fabricate team alerts or live earnings', () => {
  const items = priorityFor({ partnerProfile: { partnerId: 'MS-DEMO-0000', company: 'Demo Co', contactName: 'Demo' }, leads: [], trainingProgress: {}, teamMembers: [] });
  assert.equal(items.some((item) => /team|coaching/i.test(item.label)), false);
  assert.equal(items.some((item) => /earned|income|commission/i.test(item.label)), false);
  assert.equal(items.some((item) => item.href === './account.html#profile'), true);
});

test('Command navigation points to implemented module surfaces', () => {
  ['capital', 'growth', 'build', 'learn', 'earn', 'team', 'account'].forEach((id) => assert.match(nav, new RegExp(`id: "${id}"`)));
  assert.match(nav, /\.\/account\.html/);
  assert.match(nav, /\.\/team\.html/);
  assert.match(nav, /\.\/earn\.html/);
  assert.doesNotMatch(nav, /href: "#clients"|href: "#follow-up"/);
  assert.doesNotMatch(html, /Save Demo Profile/);
});

console.log('command integration tests passed');
