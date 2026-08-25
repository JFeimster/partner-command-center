'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { buildPublicUrl, buildLeadFormUrl, qrUrl } = require('../lib/distribution-kit');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('growth.html');
const controller = read('growth.js');

function growthApi() {
  const element = () => ({
    value: '',
    textContent: '',
    hidden: false,
    href: '',
    setAttribute() {},
    addEventListener() {}
  });
  const window = {
    sessionStorage: { getItem() { return ''; } },
    location: { search: '' },
    MoonshineData: { resources: [] },
    setTimeout() {}
  };
  const document = {
    querySelector() { return element(); },
    querySelectorAll() { return []; },
    addEventListener() {}
  };
  const context = {
    window,
    document,
    navigator: {},
    URL,
    URLSearchParams,
    fetch: async () => { throw new Error('test load skipped'); }
  };
  vm.runInNewContext(read('growth.js'), context);
  return window.PartnerGrowth;
}

const profile = { partner_id: 'partner_123', referral_code: 'REF123', slug: 'jane-smith' };
const canonical = buildPublicUrl(profile);
const campaign = growthApi().buildCampaignUrl({ referral_url: canonical }, {
  campaign: 'q3_outreach',
  utm_source: 'linkedin',
  utm_medium: 'social',
  utm_campaign: 'q3_outreach',
  utm_content: 'funding_page',
  utm_term: 'contractors'
});
const campaignUrl = new URL(campaign);
assert.strictEqual(campaignUrl.searchParams.get('ref'), 'REF123');
assert.strictEqual(campaignUrl.searchParams.get('campaign'), 'q3_outreach');
assert.strictEqual(campaignUrl.searchParams.get('utm_content'), 'funding_page');
assert.strictEqual(campaignUrl.searchParams.get('utm_term'), 'contractors');
assert.strictEqual(campaignUrl.searchParams.get('partner_id'), null);

const leadForm = new URL(buildLeadFormUrl(profile, { campaign: 'q3_outreach', utm_content: 'lead_form', utm_term: 'contractors' }));
assert.strictEqual(leadForm.searchParams.get('partner_id'), 'partner_123');
assert.strictEqual(leadForm.searchParams.get('referral_code'), 'REF123');
assert.strictEqual(leadForm.searchParams.get('campaign'), 'q3_outreach');
assert.strictEqual(leadForm.searchParams.get('utm_content'), 'lead_form');
assert.strictEqual(leadForm.searchParams.get('utm_term'), 'contractors');

const qr = new URL(qrUrl(canonical, 'png'));
assert.strictEqual(qr.searchParams.get('data'), canonical);

['funding-page', 'referral-link', 'qr-code', 'lead-form', 'campaigns', 'assets', 'widgets', 'edit-profile'].forEach((id) => assert.ok(html.includes(`id="${id}"`), `Growth section ${id} is required`));
['data-open-public', 'data-open-referral', 'data-open-lead-form', 'data-open-campaign', 'data-qr-png', 'data-qr-svg'].forEach((action) => assert.ok(html.includes(action), `Growth action ${action} is required`));
assert.ok(controller.includes('data-copy-widget'), 'runtime widget embed copy action is required');
assert.ok(html.includes('data-publication-status'));
assert.ok(html.includes('data-completeness'));
assert.ok(html.includes('./data/resources.js'));
assert.ok(html.includes('data-growth-assets'));
assert.ok(html.includes('data-growth-widgets'));
assert.ok(!html.includes('Unsplash'));
assert.ok(!html.match(/name="(partner_id|referral_code|slug)"/));

console.log('growth tests passed');
