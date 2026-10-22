'use strict';
// Draft-only campaign catalog: no network sends or enrollment side effects.
const comeback = require('../data/campaigns/MC-001.json');
const CAMPAIGNS = Object.freeze([comeback]);
function listCampaigns() { return CAMPAIGNS.map(({id,slug,name,status,version,audience})=>({id,slug,name,status,version,audience})); }
function getCampaign(id) { return CAMPAIGNS.find(c=>c.id===id || c.slug===id) || null; }
function renderTemplate(template, variables={}) {
 return String(template || '').replace(/{{\s*([a-z_]+)\s*}}/g, (original,key)=> Object.prototype.hasOwnProperty.call(variables,key) && variables[key]!=null ? String(variables[key]) : original);
}
function preview(campaignId, stepId, variables={}) {
 const c=getCampaign(campaignId);
 if(!c) throw new Error('campaign_not_found');
 const s=[...c.steps,...c.reply_branches,...c.outcome_branches].find(v=>v.id===stepId);
 if(!s) throw new Error('step_not_found');
 return {campaign_id:c.id, status:c.status, step_id:s.id, subject:renderTemplate(s.subject || '',variables), body:renderTemplate(s.body || s.response || '',variables), send_allowed:false};
}
module.exports={listCampaigns,getCampaign,renderTemplate,preview};
