(function (window, document) {
  'use strict';
  var offers = window.MoonshineData && Array.isArray(window.MoonshineData.marketplaceOffers) ? window.MoonshineData.marketplaceOffers : [];
  var funding = offers.filter(function (offer) { return offer.category === 'Funding'; });
  var router = window.MoonshineOS && window.MoonshineOS.fundingRouter;
  var form = document.querySelector('[data-capital-filters]');
  var list = document.querySelector('[data-product-list]');
  var result = document.querySelector('[data-route-result]');
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function params() { var data = {}; new FormData(form).forEach(function (value, key) { data[key] = String(value).trim(); }); return data; }
  function hydrateFromQuery() { var query = new URLSearchParams(window.location.search); ['use_of_funds', 'funding_need', 'time_in_business', 'monthly_revenue', 'industry', 'urgency'].forEach(function (key) { var field = form && form.elements[key]; if (field && query.get(key)) field.value = query.get(key); }); }
  function render(filters) {
    var route = router ? router.routeLead(filters) : null;
    var primary = route && route.primary_route ? route.primary_route.id : '';
    var matches = funding.filter(function (offer) { if (!filters.use_of_funds) return true; var text = (offer.title + ' ' + offer.summary + ' ' + offer.description + ' ' + offer.tags.join(' ')).toLowerCase(); return filters.use_of_funds.toLowerCase().split(/\s+/).some(function (term) { return term.length > 2 && text.indexOf(term) >= 0; }); });
    if (primary && primary !== 'manual_review') { var routeTerms = primary.replace('_', ' '); matches.sort(function (a, b) { return ((b.tags.join(' ') + ' ' + b.title).toLowerCase().indexOf(routeTerms) >= 0 ? 1 : 0) - ((a.tags.join(' ') + ' ' + a.title).toLowerCase().indexOf(routeTerms) >= 0 ? 1 : 0); }); }
    result.innerHTML = route ? '<div class="mpc-disclaimer"><strong>Potential fit:</strong> ' + escapeHtml(route.primary_route.label) + ' <span class="mpc-badge mpc-badge-warning">' + escapeHtml(route.primary_route.confidence) + '</span><p>' + escapeHtml(route.next_step) + '</p></div>' : '';
    list.innerHTML = matches.length ? matches.map(function (offer) { return '<article class="capital-row"><div><span class="mpc-badge mpc-badge-info">' + escapeHtml(offer.category) + '</span><h3>' + escapeHtml(offer.title) + '</h3></div><div><p>' + escapeHtml(offer.summary) + '</p><small>Review: ' + escapeHtml(offer.complianceNote) + '</small></div><a class="mpc-button mpc-button-outline mpc-button-sm" href="./marketplace.html#' + escapeHtml(offer.id) + '">View Discovery</a></article>'; }).join('') : '<div class="mpc-empty"><strong>No product paths matched.</strong><p>Broaden the client context or use manual review. No approval conclusion is implied.</p></div>';
  }
  if (form) { form.addEventListener('submit', function (event) { event.preventDefault(); render(params()); }); form.addEventListener('reset', function () { window.setTimeout(function () { render({}); }, 0); }); }
  hydrateFromQuery();
  render(form ? params() : {});
})(window, document);