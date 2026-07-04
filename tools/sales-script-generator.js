/*
  Batch 10 — Sales Script Generator

  Static template generator. No external API.
*/

(function initSalesScriptGenerator(window, document) {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function serialize(form) {
    var data = {};
    Array.prototype.slice.call(form.elements).forEach(function fieldLoop(field) {
      if (!field.name) return;
      data[field.name] = field.value.trim();
    });
    return data;
  }

  function sentence(value) {
    return String(value || "").replace(/\.$/, "");
  }

  function generate(data) {
    var partnerType = data.partnerType || "partner";
    var audience = data.audience || "business owners";
    var channel = data.channel || "Email";
    var useCase = data.useCase || "working capital";
    var tone = data.tone || "direct";
    var cta = data.cta || "review funding readiness";
    var context = data.context ? "\n\nContext to personalize:\n" + data.context : "";

    var opener = "I wanted to share a quick funding-readiness resource for " + audience + " who may be evaluating " + useCase + ".";
    var positioning = "This is not an approval promise or a guaranteed funding offer. It is a way to organize the conversation, clarify the use case, and decide whether a review path makes sense.";
    var permission = "If you want, I can share the next-step link or make a permission-based introduction so your information is only routed with your consent.";
    var disclosure = "Disclosure: I may have a referral or partner relationship connected to this resource. Funding options, terms, timelines, and eligibility are subject to review and are not guaranteed.";

    if (channel === "SMS") {
      return [
        "SMS SCRIPT — " + tone.toUpperCase(),
        "",
        "Hi [Name] — " + opener,
        "",
        "No approval or funding is guaranteed, but it can help you " + cta + ".",
        "",
        "Want me to send the checklist/review link?",
        "",
        disclosure,
        context
      ].join("\n");
    }

    if (channel === "LinkedIn DM") {
      return [
        "LINKEDIN DM — " + tone.toUpperCase(),
        "",
        "Hey [Name] — quick note. " + opener,
        "",
        positioning,
        "",
        "If useful, I can send over the resource so you can " + cta + ".",
        "",
        disclosure,
        context
      ].join("\n");
    }

    if (channel === "Phone opener") {
      return [
        "PHONE OPENER — " + tone.toUpperCase(),
        "",
        "Opening:",
        "“The reason I’m calling is simple: I work with " + audience + " who are trying to understand funding options around " + useCase + ". I’m not calling to promise approval or quote terms. I’m calling to see whether a readiness review makes sense.”",
        "",
        "Qualifying questions:",
        "1. What would the funding be used for?",
        "2. What timeline are you working with?",
        "3. Are recent business bank statements or revenue records available if requested?",
        "4. Do you already have existing advances, loans, or major obligations?",
        "5. Would you like a next-step checklist before sharing information for review?",
        "",
        "Close:",
        "“If you want to continue, I’ll send the readiness link or make a permission-based intro. No funding outcome is guaranteed.”",
        "",
        disclosure,
        context
      ].join("\n");
    }

    if (channel === "Warm intro") {
      return [
        "WARM INTRO — " + tone.toUpperCase(),
        "",
        "Subject: Intro — funding readiness conversation",
        "",
        "Hi [Business Owner] and [Moonshine Contact],",
        "",
        "Making a quick introduction here. [Business Owner] is exploring options related to " + useCase + " and may benefit from a funding-readiness conversation.",
        "",
        "To be clear, this introduction is not an approval, guarantee, or quote. It is simply a permission-based next step to review the business need, timing, and documentation.",
        "",
        "[Business Owner], you can decide what information you want to share from here.",
        "",
        "Best,",
        "[Your Name]",
        "",
        disclosure,
        context
      ].join("\n");
    }

    if (channel === "Social post") {
      return [
        "SOCIAL POST — " + tone.toUpperCase(),
        "",
        "A lot of " + audience + " wait until cash flow is already tight before organizing their funding documents.",
        "",
        "If " + useCase + " is on your radar, start with readiness: know your revenue picture, use of funds, recent statements, existing obligations, and timeline.",
        "",
        "I have a checklist that can help you " + cta + " before you start chasing options.",
        "",
        "Comment or message me if you want the resource.",
        "",
        disclosure,
        context
      ].join("\n");
    }

    return [
      "EMAIL SCRIPT — " + tone.toUpperCase(),
      "",
      "Subject: Funding readiness resource for " + sentence(useCase),
      "",
      "Hi [Name],",
      "",
      opener,
      "",
      positioning,
      "",
      "The goal is to help you " + cta + " before you waste time chasing the wrong option or sharing incomplete information.",
      "",
      permission,
      "",
      "Best,",
      "[Your Name]",
      "",
      disclosure,
      context
    ].join("\n");
  }

  function setOutput(text) {
    var output = document.getElementById("script-output");
    if (output) output.textContent = text;
  }

  ready(function onReady() {
    var form = document.getElementById("script-form");
    var copy = document.querySelector("[data-copy-script]");

    if (!form) return;

    function run() {
      var data = serialize(form);
      var script = generate(data);
      setOutput(script);

      if (window.MoonshineOS && window.MoonshineOS.analytics) {
        window.MoonshineOS.analytics.track("sales_script_generated", {
          channel: data.channel,
          partnerType: data.partnerType
        });
      }

      return script;
    }

    form.addEventListener("submit", function onSubmit(event) {
      event.preventDefault();
      run();
    });

    Array.prototype.slice.call(form.elements).forEach(function bindField(field) {
      field.addEventListener("input", run);
      field.addEventListener("change", run);
    });

    if (copy) {
      copy.addEventListener("click", function onCopy() {
        var ui = window.MoonshineOS && window.MoonshineOS.ui;
        var text = document.getElementById("script-output").textContent;

        if (ui && ui.copyText) {
          ui.copyText(text).then(function copied() {
            if (ui.toast) {
              ui.toast(copied ? "Script copied." : "Copy may not be available.", {
                tone: copied ? "success" : "warning"
              });
            }
          });
        }
      });
    }

    run();
  });
})(window, document);
