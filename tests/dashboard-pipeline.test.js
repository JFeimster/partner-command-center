'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function read(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

function makeRenderer() {
  const window = {
    MoonshineOS: {
      ui: {
        escapeHTML(value) {
          return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        },
        formatCurrency(value) {
          return '$' + Number(value || 0).toLocaleString();
        },
        formatDate(value) {
          return new Date(value).toISOString().slice(0, 10);
        }
      },
      dashboard: {
        config: {
          leadStatuses: [
            { id: 'new', label: 'New', tone: 'info' },
            { id: 'reviewing', label: 'Reviewing', tone: 'success' },
            { id: 'needsInfo', label: 'Needs Info', tone: 'warning' },
            { id: 'submitted', label: 'Submitted', tone: 'success' },
            { id: 'funded', label: 'Funded', tone: 'success' },
            { id: 'declined', label: 'Declined', tone: 'danger' },
            { id: 'archived', label: 'Archived', tone: 'default' }
          ]
        }
      }
    }
  };
  vm.runInNewContext(read('dashboard/dashboard-renderers.js'), { window, document: {} });
  return window.MoonshineOS.dashboard.renderers;
}

function makeLeadStore() {
  const values = new Map();
  const window = {
    MoonshineOS: {
      storage: {
        get(key, fallback) { return values.has(key) ? values.get(key) : fallback; },
        set(key, value) { values.set(key, value); }
      },
      dashboard: {
        config: { storageKeys: { leads: 'leads' } },
        seedData: { leads: [] },
        state: { setState() {} },
        partnerStore: { getProfile() { return { partnerId: 'MS-TEST-1234', contactName: 'Test Partner' }; } },
        eventStore: { addEvent() {} }
      }
    }
  };
  vm.runInNewContext(read('dashboard/lead-store.js'), { window });
  return window.MoonshineOS.dashboard.leadStore;
}

const renderers = makeRenderer();
const today = new Date();
today.setHours(12, 0, 0, 0);
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

const leads = [
  { id: 'new-1', businessName: 'New Client', contactName: 'A. Client', status: 'new', fundingNeed: 25000, nextStep: 'Confirm revenue details', updatedAt: today.toISOString(), followUpAt: today.toISOString() },
  { id: 'overdue-1', businessName: 'Overdue Client', status: 'reviewing', nextStep: 'Call owner', updatedAt: yesterday.toISOString(), followUpAt: yesterday.toISOString() },
  { id: 'docs-1', businessName: 'Docs Client', status: 'needsInfo', documentStatus: 'requested', nextStep: 'Send readiness checklist', updatedAt: today.toISOString(), followUpAt: yesterday.toISOString() },
  { id: 'lender-1', businessName: 'Lender Client', status: 'submitted', followUpState: 'waiting_on_lender', nextStep: 'Await provider update', updatedAt: today.toISOString(), followUpAt: today.toISOString() },
  { id: 'closed-1', businessName: 'Closed Client', status: 'declined', nextStep: 'Educational follow-up' }
];

const leadQueue = renderers.renderLeadQueue(leads);
assert.match(leadQueue, /New Client/);
assert.match(leadQueue, /Confirm revenue details/);
assert.match(leadQueue, /data-open-client="new-1"/);
assert.match(leadQueue, /Needs Info/);

const clients = renderers.renderClientWorkspace(leads);
assert.match(clients, /New Client/);
assert.match(clients, /Docs Client/);
assert.match(clients, /Requested/);
assert.match(clients, /Last activity/);
assert.match(clients, /data-open-client="docs-1"/);
assert.doesNotMatch(clients, /Closed Client/);

const followUp = renderers.renderFollowUpQueue(leads);
assert.match(followUp, /TODAY/);
assert.match(followUp, /OVERDUE/);
assert.match(followUp, /WAITING ON CLIENT/);
assert.match(followUp, /WAITING ON LENDER/);
assert.match(followUp, /WHO|Docs Client/);
assert.match(followUp, /Send readiness checklist/);

assert.match(renderers.renderLeadQueue([]), /No active queue/);
assert.match(renderers.renderClientWorkspace([]), /No client workspace yet/);
assert.match(renderers.renderFollowUpQueue([]), /No follow-up items/);

const leadStore = makeLeadStore();
const created = leadStore.createLead({
  businessName: 'Attributed Client',
  contactName: 'Partner Contact',
  email: 'contact@example.com'
});
assert.strictEqual(created.partnerId, 'MS-TEST-1234');
assert.strictEqual(Object.prototype.hasOwnProperty.call(created, 'partner_id'), false);
assert.strictEqual(Object.prototype.hasOwnProperty.call(created, 'referral_code'), false);
assert.strictEqual(Object.prototype.hasOwnProperty.call(created, 'companyName'), false);
assert.strictEqual(created.status, 'new');

const html = read('dashboard.html');
const nav = read('data/dashboard-nav.js');
assert.match(nav, /href: "#leads"/);
assert.doesNotMatch(nav, /href: "#clients"|href: "#follow-up"/);
assert.match(html, /data-render-lead-queue/);
assert.match(html, /data-render-client-workspace/);
assert.match(html, /data-render-follow-up-queue/);
assert.match(html, /name="businessName"[^>]+required/);
assert.match(html, /name="contactName"[^>]+required/);
assert.doesNotMatch(html, /name="partner_id"|name="referral_code"/);

console.log('dashboard pipeline tests passed');
