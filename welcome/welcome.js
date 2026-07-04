/*
  Moonshine Partner Command Center
  Batch 07 — Welcome Flow

  Reads local demo partner profile and renders welcome state.
*/

(function initWelcomeFlow(window, document) {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function titleCase(value) {
    return String(value || "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, function upper(match) {
        return match.toUpperCase();
      });
  }

  ready(function onReady() {
    var os = window.MoonshineOS || {};
    var ui = os.ui;
    var storage = os.storage;
    var attribution = os.affiliateTracking;

    if (!ui || !storage) return;

    var profile = storage.get("partnerProfile", null);

    if (!profile) {
      ui.toast("No local partner profile found. Create one first.", { tone: "warning" });

      window.setTimeout(function goAccess() {
        window.location.href = "../partner-access.html";
      }, 850);

      return;
    }

    var name = profile.contactName || "Demo Partner";
    var company = profile.company || "Moonshine Partner";
    var partnerId = profile.partnerId || "MS-DEMO-0000";
    var type = profile.partnerType || "funding-partner";
    var audience = profile.primaryAudience || "Business owners seeking funding readiness";

    ui.setText("[data-profile-initials]", ui.getInitials(name, company));
    ui.setText("[data-profile-name]", name);
    ui.setText("[data-profile-company]", company);
    ui.setText("[data-profile-partner-id]", partnerId);
    ui.setText("[data-profile-type]", titleCase(type));
    ui.setText("[data-profile-audience]", audience);
    ui.setText("[data-welcome-message]", "Welcome, " + name + ". Your local demo partner profile is ready. Your partner ID is " + partnerId + ".");

    if (attribution) {
      attribution.hydratePartnerFields(document);
      attribution.bindCopyButtons(document);
    }

    var steps = document.getElementById("welcome-steps");
    var pathData = (window.MoonshineData && window.MoonshineData.partnerPaths) || [];
    var matchedPath = pathData.find(function findPath(path) {
      return path.id === type;
    });

    if (steps && matchedPath) {
      steps.innerHTML = matchedPath.onboardingSteps.slice(0, 6).map(function stepCard(step, index) {
        return [
          '<article class="welcome-step">',
          '<span class="welcome-step-number">' + String(index + 1).padStart(2, "0") + '</span>',
          '<h3>' + ui.escapeHTML(step) + '</h3>',
          '<p>' + ui.escapeHTML(matchedPath.headline) + '</p>',
          '</article>'
        ].join("");
      }).join("");
    }

    storage.pushToArray("events", {
      id: "event_" + Date.now().toString(36),
      type: "partner.welcome_viewed",
      label: "Welcome viewed",
      actor: name,
      partnerId: partnerId,
      target: "Welcome flow",
      message: "Viewed welcome page for local demo partner profile.",
      createdAt: new Date().toISOString(),
      tone: "success"
    }, 120);

    if (os.analytics) {
      os.analytics.track("welcome_viewed", {
        partnerType: type,
        partnerId: partnerId
      });
    }
  });
})(window, document);
