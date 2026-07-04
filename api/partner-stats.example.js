/*
  Moonshine Partner Command Center
  API Example — partner-stats.example.js

  Future endpoint:
    GET /api/partner-stats?partner_id=MS-FB-1024

  Status:
    Example only. No production database/CRM connection.
*/

const COMPLIANCE_MESSAGE =
  "Partner stats are workflow metrics only. They do not guarantee deal flow, approval, funding, commissions, income, or payout timing.";

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload, null, 2));
}

function methodNotAllowed(res) {
  sendJson(res, 405, {
    ok: false,
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "Use GET for this endpoint."
    }
  });
}

function parseUrl(req) {
  return new URL(req.url, "http://localhost");
}

function verifyBearer(req) {
  /*
    Replace with real token verification and partner scoping.
  */

  const auth = req.headers.authorization || "";

  if (!auth.startsWith("Bearer ")) {
    return {
      ok: false,
      code: "MISSING_BEARER_TOKEN"
    };
  }

  return {
    ok: true,
    scopes: ["partner:read"],
    partner_id: "MS-DEMO-0000"
  };
}

function validatePartnerId(value) {
  return /^MS-[A-Z]+-[0-9A-Z]{4,}$/i.test(String(value || ""));
}

async function loadPartnerStats(partnerId) {
  /*
    Replace with real CRM/database aggregation.

    Keep commission status separate from lead status.
    Never report unverified commissions as payable.
  */

  const demo = {
    "MS-FB-1024": {
      partner_id: "MS-FB-1024",
      partner_status: "active",
      total_leads: 12,
      open_leads: 6,
      needs_info: 2,
      submitted: 3,
      funded_examples: 2,
      declined: 1,
      resources_saved: 5,
      training_percent: 62,
      estimated_pending_commissions: 1850,
      demo_paid_commissions: 2750
    },
    "MS-AF-2048": {
      partner_id: "MS-AF-2048",
      partner_status: "active",
      total_leads: 28,
      open_leads: 11,
      needs_info: 4,
      submitted: 2,
      funded_examples: 1,
      declined: 3,
      resources_saved: 7,
      training_percent: 48,
      estimated_pending_commissions: 350,
      demo_paid_commissions: 0
    }
  };

  return demo[partnerId] || {
    partner_id: partnerId,
    partner_status: "unknown-demo",
    total_leads: 0,
    open_leads: 0,
    needs_info: 0,
    submitted: 0,
    funded_examples: 0,
    declined: 0,
    resources_saved: 0,
    training_percent: 0,
    estimated_pending_commissions: 0,
    demo_paid_commissions: 0
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  const auth = verifyBearer(req);

  if (!auth.ok) {
    return sendJson(res, 401, {
      ok: false,
      error: {
        code: auth.code,
        message: "Bearer token is required before partner stats can be read."
      }
    });
  }

  const url = parseUrl(req);
  const partnerId = url.searchParams.get("partner_id") || auth.partner_id;

  if (!validatePartnerId(partnerId)) {
    return sendJson(res, 400, {
      ok: false,
      error: {
        code: "INVALID_PARTNER_ID",
        message: "Provide a valid partner_id such as MS-FB-1024.",
        fields: ["partner_id"]
      }
    });
  }

  const stats = await loadPartnerStats(partnerId);

  return sendJson(res, 200, {
    ok: true,
    partner_id: partnerId,
    metrics: stats,
    generated_at: new Date().toISOString(),
    disclaimer: COMPLIANCE_MESSAGE
  });
}
