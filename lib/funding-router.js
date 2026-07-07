// Partner Command Center — funding router rules
// Sprint 05: product-fit routing, not lender submission or approval logic.

'use strict';

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function lower(value) {
  return clean(value).toLowerCase();
}

function parseMonths(value) {
  const text = lower(value);
  const numeric = Number(text.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric)) return 0;
  if (/year|yr/.test(text)) return Math.round(numeric * 12);
  return Math.round(numeric);
}

function routeLead(leadInput) {
  const lead = leadInput || {};
  const monthlyRevenue = Number(lead.monthly_revenue || 0);
  const fundingNeed = Number(lead.funding_need || 0);
  const timeInBusinessMonths = parseMonths(lead.time_in_business || '');
  const use = lower(lead.use_of_funds || '');
  const industry = lower(lead.industry || '');
  const urgency = lower(lead.urgency || '');

  const routes = [];
  const flags = [];

  if (monthlyRevenue < 10000) flags.push('low_monthly_revenue_review');
  if (timeInBusinessMonths > 0 && timeInBusinessMonths < 6) flags.push('early_stage_review');
  if (fundingNeed > monthlyRevenue * 3 && monthlyRevenue > 0) flags.push('funding_need_high_vs_revenue');
  if (/lawsuit|bankruptcy|tax lien|judgment/.test(use + ' ' + industry)) flags.push('manual_review_signal');

  if (/equipment|vehicle|truck|machinery|tools/.test(use)) {
    routes.push({ id: 'equipment_finance', label: 'Equipment finance review', confidence: 'medium', reason: 'Use of funds references equipment, vehicles, tools, or machinery.' });
  }

  if (/invoice|receivable|ar|accounts receivable|net 30|net-30/.test(use)) {
    routes.push({ id: 'invoice_finance', label: 'Invoice finance review', confidence: 'medium', reason: 'Use of funds references invoices or receivables.' });
  }

  if (/inventory|payroll|marketing|cash flow|working capital|expansion|bridge/.test(use)) {
    routes.push({ id: 'working_capital', label: 'Working capital review', confidence: monthlyRevenue >= 15000 ? 'medium' : 'low', reason: 'Use of funds fits working-capital style needs.' });
  }

  if (/real estate|construction|contractor|renovation|fix/.test(use + ' ' + industry)) {
    routes.push({ id: 'project_capital_review', label: 'Project capital review', confidence: 'low', reason: 'Industry/use may require project-specific review.' });
  }

  if (!routes.length) {
    routes.push({ id: 'manual_review', label: 'Manual funding-fit review', confidence: 'low', reason: 'No strong product-fit signal was detected.' });
  }

  const primary = routes[0];
  const nextStep = flags.length
    ? 'Review lead manually before any external submission or lender discussion.'
    : 'Review business fit, request missing context if needed, then decide whether to advance.';

  return {
    primary_route: primary,
    alternative_routes: routes.slice(1),
    flags,
    next_step: nextStep,
    disclaimer: 'Routing is an internal product-fit recommendation only. It is not a funding approval, lender match, quote, offer, or commitment.'
  };
}

module.exports = {
  routeLead,
  parseMonths
};
