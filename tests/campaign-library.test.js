'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const lib=require('../lib/campaign-library');
test('campaign MC-001 is a draft and never enables sending',()=>{const c=lib.getCampaign('MC-001');assert.equal(c.status,'draft');assert.equal(c.sending.enabled,false);assert.equal(c.steps.length,3);assert.equal(c.reply_branches.length,6);assert.equal(c.outcome_branches.length,2)});
test('renders applicant name without fabricating missing variables',()=>{const r=lib.preview('MC-001','001.01',{first_name:'Sam'});assert.match(r.body,/Hey Sam/);assert.equal(r.send_allowed,false)});
test('resource placeholder remains apparent until an asset is verified',()=>{const r=lib.preview('MC-001','001.02',{first_name:'Alex'});assert.match(r.body,/{{resource_url}}/)});
test('only substantive reply exits drip and transaction-only suppresses journey',()=>{const c=lib.getCampaign('MC-001');assert.equal(c.policy.substantive_reply_stops_drip,true);assert.equal(c.reply_branches.find(b=>b.id==='001.F').stop_journey,true)});
