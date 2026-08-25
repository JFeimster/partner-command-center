'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const account = read('account.html');
const controller = read('account.js');
const storeSource = read('dashboard/partner-store.js');
const distribution = read('lib/distribution-kit.js');
const growth = read('growth.js');
const nav = read('data/dashboard-nav.js');

test('Account exposes Profile, Compliance, and Settings with coherent routes', () => {
  ['profile', 'compliance', 'settings'].forEach((id) => assert.match(account, new RegExp(`id="${id}"`)));
  assert.match(nav, /href: "\.\/account\.html"/);
  assert.match(nav, /href: "\.\/account\.html#compliance"/);
  assert.match(nav, /href: "\.\/account\.html#settings"/);
  assert.match(account, /data-account-profile/);
  assert.match(account, /data-account-settings/);
});

test('Account keeps system identity locked and links to the canonical public profile', () => {
  ['Partner ID', 'Referral code', 'Slug', 'Profile status'].forEach((label) => assert.match(account, new RegExp(label, 'i')));
  assert.match(controller, /publication_status/);
  assert.match(account, /data-account-public/);
  assert.match(account, /data-account-copy-public/);
  assert.match(account, /growth\.html#funding-page/);
  assert.doesNotMatch(account, /name="(partner_id|referral_code|slug|approval_status|profile_status)"/);
  assert.match(controller, /public_url/);
  assert.match(growth, /public_url/);
});

test('Account uses real compliance documents without fabricated acknowledgements', () => {
  ['compliance.html', 'affiliate-disclosure.html', 'terms.html', 'privacy.html'].forEach((file) => assert.match(account, new RegExp(file.replace('.', '\\.'))));
  assert.match(account, /Acknowledgement status: Not tracked/);
  assert.doesNotMatch(account, /Acknowledged|Current|Action Needed/);
});

test('Account persists only genuine preferences separately from profile identity', () => {
  assert.match(account, /compactMode/);
  assert.match(account, /showSeedData/);
  assert.match(controller, /account\.preferences_saved/);
  assert.match(controller, /dashboard\.state\.setState/);
  assert.doesNotMatch(controller, /notion|api_key|secret|environment/i);
});

test('Local profile updates preserve meaningful values and immutable identity', () => {
  const values = new Map();
  const window = {
    MoonshineOS: {
      ui: { slugify(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-'); } },
      storage: { get(key, fallback) { return values.has(key) ? values.get(key) : fallback; }, set(key, value) { values.set(key, value); } },
      dashboard: {
        config: { storageKeys: { partnerProfile: 'partnerProfile' } },
        seedData: { partnerProfile: { partnerId: 'MS-FB-1234', referralCode: 'REF-1234', slug: 'jane-smith', contactName: 'Jane Smith', company: 'Capital Co' } },
        state: { setState() {} }
      }
    }
  };
  vm.runInNewContext(storeSource, { window });
  const store = window.MoonshineOS.dashboard.partnerStore;
  const updated = store.updateProfile({ company: '', contactName: '', partnerId: 'MS-CHANGED', referralCode: 'CHANGED', slug: 'changed' });
  assert.equal(updated.company, 'Capital Co');
  assert.equal(updated.contactName, 'Jane Smith');
  assert.equal(updated.partnerId, 'MS-FB-1234');
  assert.equal(updated.referralCode, 'REF-1234');
  assert.equal(updated.slug, 'jane-smith');
});

test('Profile API ignores blank editable values instead of erasing canonical data', () => {
  assert.match(distribution, /changes\[key\] === ''/);
  assert.match(distribution, /Array\.isArray\(changes\[key\]\) && changes\[key\]\.length === 0/);
  assert.match(distribution, /const EDITABLE/);
});

console.log('account tests passed');