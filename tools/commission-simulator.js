/*
  Batch 10 — Commission Simulator

  Static educational math only.
*/

(function initCommissionSimulator(window, document) {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function currency(value) {
    var ui = window.MoonshineOS && window.MoonshineOS.ui;
    return ui && ui.formatCurrency ? ui.formatCurrency(value) : "$" + Math.round(value || 0).toLocaleString();
  }

  function percent(value) {
    return Math.round(value * 10) / 10 + "%";
  }

  function serialize(form) {
    var data = {};
    Array.prototype.slice.call(form.elements).forEach(function fieldLoop(field) {
      if (!field.name) return;
      data[field.name] = field.value;
    });
    return data;
  }

  function calculate(data) {
    var leads = number(data.leadVolume, 0);
    var qualifiedRate = number(data.qualifiedRate, 0) / 100;
    var fundedRate = number(data.fundedRate, 0) / 100;
    var averageFunding = number(data.averageFunding, 0);
    var flatAmount = number(data.flatAmount, 0);
    var percentRate = number(data.percentRate, 0) / 100;
    var months = Math.max(1, number(data.months, 1));
    var qualified = leads * qualifiedRate;
    var funded = qualified * fundedRate;

    var commissionPerDeal = 0;

    if (data.model === "flat") {
      commissionPerDeal = flatAmount;
    } else if (data.model === "percent") {
      commissionPerDeal = averageFunding * percentRate;
    } else {
      commissionPerDeal = flatAmount + averageFunding * percentRate;
    }

    var monthlyCommission = funded * commissionPerDeal;

    return {
      leads: leads,
      qualified: qualified,
      funded: funded,
      averageFunding: averageFunding,
      commissionPerDeal: commissionPerDeal,
      monthlyCommission: monthlyCommission,
      totalCommission: monthlyCommission * months,
      months: months,
      qualificationRate: qualifiedRate,
      fundedRate: fundedRate
    };
  }

  function render(result) {
    var target = document.getElementById("commission-results");
    if (!target) return;

    target.innerHTML = [
      '<div class="tool-metric"><span>Qualified leads / month</span><strong>' + result.qualified.toFixed(1) + '</strong></div>',
      '<div class="tool-metric"><span>Estimated funded deals / month</span><strong>' + result.funded.toFixed(2) + '</strong></div>',
      '<div class="tool-metric"><span>Example commission / funded deal</span><strong>' + currency(result.commissionPerDeal) + '</strong></div>',
      '<div class="tool-metric"><span>Example monthly commission</span><strong>' + currency(result.monthlyCommission) + '</strong></div>',
      '<div class="tool-metric"><span>Example ' + result.months + '-month projection</span><strong>' + currency(result.totalCommission) + '</strong></div>',
      '<div class="mpc-disclaimer">Scenario uses ' + percent(result.qualificationRate * 100) + ' qualification rate and ' + percent(result.fundedRate * 100) + ' funded-from-qualified rate. This is not a payout promise or earnings guarantee.</div>'
    ].join("");
  }

  function run(form) {
    var result = calculate(serialize(form));
    render(result);

    var os = window.MoonshineOS || {};
    if (os.analytics) {
      os.analytics.track("commission_simulation_run", {
        leads: result.leads,
        funded: result.funded,
        totalCommission: Math.round(result.totalCommission)
      });
    }
  }

  ready(function onReady() {
    var form = document.getElementById("commission-form");
    var reset = document.querySelector("[data-reset-sim]");

    if (!form) return;

    form.addEventListener("submit", function onSubmit(event) {
      event.preventDefault();
      run(form);
    });

    Array.prototype.slice.call(form.elements).forEach(function bindField(field) {
      field.addEventListener("input", function onInput() {
        run(form);
      });
      field.addEventListener("change", function onChange() {
        run(form);
      });
    });

    if (reset) {
      reset.addEventListener("click", function onReset() {
        form.reset();
        run(form);
      });
    }

    run(form);
  });
})(window, document);
