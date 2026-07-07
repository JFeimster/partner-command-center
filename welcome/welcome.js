/*
  Moonshine Partner Command Center
  Batch 07 + Sprint 03 — Welcome Flow

  Reads local or live-activated partner profile and renders welcome state.
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

  function getPathSteps(profile, matchedPath) {
    if (profile.liveMode && profile.onboardingPath === "manual_review_path") {
      return [
        "Confirm review status",
        "Review safe partner resources",
        "Wait for activation or missing-info request"
      ];
    }

    if (profile.liveMode && Array.isArray(profile.resourceRecommendations) && profile.resourceRecommendations.length) {
      return profile.resourceRecommendations.slice(0, 5);
    }

    if (matchedPath && Array.isArray(matchedPath.onboardingSteps)) {
      return matchedPath.onboardingSteps.slice(0, 6);
    }

    return [
      "Confirm partner ID",
      "Review compliance basics",
      "Open dashboard"
    ];
  }

  ready(function onReady() {
    var os = window.MoonshineOS || {};
    var ui = os.ui;
    var storage = os.storage;
    var attribution = os.affiliateTracking;

    if (!ui || !storage) return;

    var profile = storage.get("partnerProfile", null);

    if (!profile) {
      ui.toast("No partner profile found. Create or activate one first.", { tone: "warning" });

      window.setTimeout(function goAccess() {
        window.location.href = "../partner-access.html";
      }, 850);

      return;
    }

    var isLive = Boolean(profile.liveMode);
    var name = profile.contactName || "Partner";
    var company = profile.company || "Moonshine Partner";
    var partnerId = profile.partnerId || "MS-DEMO-0000";
    var type = profile.partnerType || "funding-partner";
    var audience = profile.primaryAudience || "Business owners seeking funding readiness";
    var status = profile.status || (isLive ? "needs_review" : "active-demo");

    ui.setText("[data-profile-initials]", ui.getInitials(name, company));
    ui.setText("[data-profile-name]", name);
    ui.setText("[data-profile-company]", company);
    ui.setText("[data-profile-partner-id]", partnerId);
    ui.setText("[data-profile-type]", titleCase(type));
    ui.setText("[data-profile-audience]", audience);
    ui.setText(
      "[data-welcome-message]",
      isLive
        ? "Welcome, " + name + ". Your live partner profile is loaded. Status: " + titleCase(status) + "."
        : "Welcome, " + name + ". Your local demo partner profile is ready. Your partner ID is " + partnerId + "."
    );

    var badge = document.querySelector(".welcome-profile-card .mpc-badge");
    if (badge) {
      badge.textContent = isLive ? "Live partner profile" : "Local demo profile";
      badge.classList.toggle("mpc-badge-success", true);
    }

    var disclaimer = document.querySelector(".welcome-copy .mpc-disclaimer");
    if (disclaimer) {
      disclaimer.textContent = isLive
        ? "Live activation mode loads partner profile context from the API router. No browser secrets are stored. Lead submission remains demo/local until the lead routing sprint."
        : "This is a static demo. Your partner profile is stored locally in this browser and does not create a live account, funding application, CRM record, lender submission, or commission record.";
    }

    if (attribution) {
      attribution.hydratePartnerFields(document);
      attribution.bindCopyButtons(document);
    }

    var steps = document.getElementById("welcome-steps");
    var pathData = (window.MoonshineData && window.MoonshineData.partnerPaths) || [];
    var matchedPath = pathData.find(function findPath(path) {
      return path.id === type || path.id === profile.onboardingPath;
    });
    var stepList = getPathSteps(profile, matchedPath);

    if (steps) {
      steps.innerHTML = stepList.map(function stepCard(step, index) {
        return [
          '<article class="welcome-step">',
          '<span class="welcome-step-number">' + String(index + 1).padStart(2, "0") + '</span>',
          '<h3>' + ui.escapeHTML(step) + '</h3>',
          '<p>' + ui.escapeHTML(isLive ? "Assigned from live activation context." : (matchedPath && matchedPath.headline || "Local demo onboarding step.")) + '</p>',
          '</article>'
        ].join("");
      }).join("");
    }

    storage.pushToArray("events", {
      id: "event_" + Date.now().toString(36),
      type: isLive ? "partner.live_welcome_viewed" : "partner.welcome_viewed",
      label: isLive ? "Live welcome viewed" : "Welcome viewed",
      actor: name,
      partnerId: partnerId,
      target: "Welcome flow",
      message: isLive ? "Viewed welcome page with live activation context." : "Viewed welcome page for local demo partner profile.",
      createdAt: new Date().toISOString(),
      tone: "success"
    }, 120);

    if (os.analytics) {
      os.analytics.track("welcome_viewed", {
        partnerType: type,
        partnerId: partnerId,
        liveMode: isLive
      });
    }
  });
})(window, document);
