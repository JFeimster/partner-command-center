/*
  Moonshine Partner Command Center
  API Example — lead-status.example.js

  Future endpoint:
    GET /api/lead-status/:lead_id
    or
    GET /api/lead-status?lead_id=lead_abc123

  Status:
    Example only. Partner-visible statuses only.
*/

const PARTNER_VISIBLE_STATUSES = [
  "new",
  "reviewing",
  "needsInfo",
  "submitted",
  "funded",
  "declined",
  "archived"
];

const STATUS_MESSAGES = {
  new: "Lead has been received for review.",
  reviewing: "Lead is being reviewed for next steps.",
  needsInfo: "Additional information may be needed before the review can continue.",
  submitted: "Lead has been submitted into a review workflow.",
  funded: "Lead is marked as funded in the permitted partner-visible status layer.",
  declined: "Lead is marked as declined in the permitted partner-visible status layer.",
  archived: "Lead has been archived."
};

const COMPLIANCE_MESSAGE =
  "Status information is partner-visible workflow context only. It does not guarantee approval, funding, rates, terms, timelines, commissions, income, or any business outcome.";

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

function getLeadId(req) {
  const url = parseUrl(req);
  const queryLeadId = url.searchParams.get("lead_id") || url.searchParams.get("id");

  if (queryLeadId) return queryLeadId;

  const parts = url.pathname.split("/").filter(Boolean);
  const index = parts.indexOf("lead-status");

  if (index >= 0 && parts[index + 1]) {
    return parts[index + 1];
  }

  return "";
}

function verifyBearer(req) {
  /*
    Replace this with real auth:
      - validate JWT/session
      - scope the partner
      - confirm the lead belongs to that partner
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
    partner_id: "MS-DEMO-0000"
  };
}

async function getLeadStatusRecord(leadId, authContext) {
  /*
    Replace with a real database/CRM lookup.

    Important:
      - Scope by authenticated partner/operator.
      - Do not expose internal underwriting notes.
      - Do not expose sensitive documents.
      - Do not expose provider-only statuses unless approved.
  */

  const demoStatuses = {
    lead_demo_001: "reviewing",
    lead_demo_002: "needsInfo",
    lead_demo_003: "new",
    lead_demo_004: "submitted",
    lead_demo_005: "funded",
    lead_demo_006: "declined"
  };

  const status = demoStatuses[leadId] || null;

  if (!status) return null;

  return {
    lead_id: leadId,
    partner_id: authContext.partner_id,
    status,
    message: STATUS_MESSAGES[status],
    next_action: status === "needsInfo"
      ? "Request missing business readiness information."
      : "Monitor for the next permitted workflow update.",
    updated_at: new Date().toISOString()
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
        message: "Bearer token is required before lead status can be read."
      }
    });
  }

  const leadId = getLeadId(req);

  if (!leadId) {
    return sendJson(res, 400, {
      ok: false,
      error: {
        code: "MISSING_LEAD_ID",
        message: "Provide a lead_id query parameter or path parameter."
      }
    });
  }

  const record = await getLeadStatusRecord(leadId, auth);

  if (!record) {
    return sendJson(res, 404, {
      ok: false,
      error: {
        code: "LEAD_NOT_FOUND",
        message: "Lead was not found or is not visible to this partner."
      }
    });
  }

  if (!PARTNER_VISIBLE_STATUSES.includes(record.status)) {
    return sendJson(res, 403, {
      ok: false,
      error: {
        code: "STATUS_NOT_VISIBLE",
        message: "This lead status is not available in the partner-visible layer."
      }
    });
  }

  return sendJson(res, 200, {
    ok: true,
    ...record,
    disclaimer: COMPLIANCE_MESSAGE
  });
}
