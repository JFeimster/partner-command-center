'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('fs');
const path = require('path');
const { routeLead } = require('../lib/funding-router');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const capital = read('capital.html');
const controller = read('capital.js');
const nav = read('data/dashboard-nav.js');
const offers = read('data/marketplace-offers.js');

test('Capital exposes Product Desk, Providers, and Marketplace without dead local routes', () => {
  assert.match(capital, /id="product-desk"/);
  assert.match(capital, /id="providers"/);
  assert.match(capital, /id="marketplace"/);
  assert.match(capital, /marketplace\.html/);
  assert.match(capital, /data-product-list/);
  assert.match(capital, /No verified provider records connected/);
  assert.match(nav, /href: "\.\/capital\.html#product-desk"/);
  assert.match(nav, /href: "\.\/capital\.html#providers"/);
  assert.match(nav, /href: "\.\/marketplace\.html"/);
});

test('Product Desk reuses the marketplace registry and canonical router', () => {
  assert.match(capital, /data\/marketplace-offers\.js/);
  assert.match(capital, /lib\/funding-router\.js/);
  assert.match(controller, /marketplaceOffers/);
  assert.match(controller, /fundingRouter/);
  assert.match(controller, /offer\.id/);
  const route = routeLead({ use_of_funds: 'equipment replacement', funding_need: 75000, monthly_revenue: 50000, time_in_business: '3 years' });
  assert.equal(route.primary_route.id, 'equipment_finance');
  assert.equal(route.disclaimer.includes('approval'), true);
});

test('Capital does not fabricate provider or submission records', () => {
  assert.match(capital, /Only verified provider records/);
  assert.doesNotMatch(capital, /Provider [A-Z]|Lender [A-Z]/);
  assert.doesNotMatch(capital, /START SUBMISSION|Open Provider/);
  assert.match(controller, /View Discovery/);
});

test('Pipeline context handoff preserves client data without identity fields', () => {
  const renderer = read('dashboard/dashboard-renderers.js');
  assert.match(renderer, /capital\.html\?business_name/);
  assert.match(renderer, /use_of_funds/);
  assert.match(renderer, /funding_need/);
  assert.doesNotMatch(renderer, /capital\.html\?[^']*(partner_id|referral_code)/);
  assert.match(offers, /category: "Funding"/);
});

console.log('capital tests passed');