/*
  Moonshine Partner Command Center
  API Example — leads-submit.example.js

  Future endpoint:
    POST /api/leads-submit

  Status:
    Example only. Not connected to a database, CRM, lender, underwriting system,
    partner portal, or commission engine.

  Production requirements before activation:
    - API key or signed widget token verification
    - Partner ID validation
    - Consent capture
    - Server-side validation
    - Spam/bot protection
    - Rate limiting
    - Audit logging
    - Secure CRM/database write
*/

const COMPLIANCE_MESSAGE =
  "Lead received for review. No approval, funding, rates, terms, timeline, lender review, commission, income, or business outcome is guaranteed.";

const RESTRICTED_TERMS = [
  "guaranteed funding",
  "guaranteed approval",
  "everyone qualifies",
  "risk-free funding",
  "guaranteed commissions",
  "automatic approval",
  "earn guaranteed income"
];

const SENSITIVE_TERMS = [
  "ssn",
  "social security",
  "bank login",
  "password",
  "account number",
  "routing number",
  "tax id",
  "ein document"
];

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
      message: "Use POST for this endpoint."
    }
  });
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  if (!chunks.length) return {};

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function isValidEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
}

function toText(value) {
  return String(value == null ? "" : value).trim();
}

function containsAnyTerm(payload, terms) {
  const text = JSON.stringify(payload || {}).toLowerCase();
  return terms.filter((term) => text.includes(term));
}

function validatePayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== "object") {
    errors.push("payload");
    return errors;
  }

  if (!toText(payload.partner_id)) errors.push("partner_id");
  if (!payload.business || typeof payload.business !== "object") errors.push("business");
  if (!payload.business || !toText(payload.business.name)) errors.push("business.name");
  if (!payload.contact || typeof payload.contact !== "object") errors.push("contact");
  if (!payload.contact || !toText(payload.contact.name)) errors.push("contact.name");

  if (payload.contact && payload.contact.email && !isValidEmail(payload.contact.email)) {
    errors.push("contact.email");
  }

  if (!payload.consent || payload.consent.confirmed !== true) {
    errors.push("consent.confirmed");
  }

  const restricted = containsAnyTerm(payload, RESTRICTED_TERMS);
  if (restricted.length) errors.push("restricted_language");

  const sensitive = containsAnyTerm(payload, SENSITIVE_TERMS);
  if (sensitive.length) errors.push("sensitive_data_detected");

  return errors;
}

function normalizeLead(payload) {
  const now = new Date().toISOString();

  return {
    lead_id: `lead_${Date.now().toString(36)}`,
    partner_id: toText(payload.partner_id),
    source: toText(payload.source || "api"),
    status: "new",
    business: {
      name: toText(payload.business.name),
      industry: toText(payload.business.industry),
      monthly_revenue_estimate: Number(payload.business.monthly_revenue_estimate || 0),
      time_in_business: toText(payload.business.time_in_business)
    },
    contact: {
      name: toText(payload.contact.name),
      email: toText(payload.contact.email),
      phone: toText(payload.contact.phone)
    },
    funding: {
      requested_amount_estimate: Number(payload.funding && payload.funding.requested_amount_estimate || 0),
      use_of_funds: toText(payload.funding && payload.funding.use_of_funds),
      timeline: toText(payload.funding && payload.funding.timeline)
    },
    consent: {
      confirmed: true,
      method: toText(payload.consent.method || "not provided"),
      captured_at: payload.consent.captured_at || now
    },
    metadata: {
      created_at: now,
      local_demo: false,
      compliance_message: COMPLIANCE_MESSAGE
    }
  };
}

function verifyApiKey(req) {
  /*
    Replace this with real API key verification.

    Example:
      const expected = process.env.MOONSHINE_API_KEY;
      const received = req.headers["x-api-key"];
      return expected && received && timingSafeEqual(received, expected);
  */

  const received = req.headers["x-api-key"];

  if (!received) {
    return {
      ok: false,
      code: "MISSING_API_KEY"
    };
  }

  return {
    ok: true
  };
}

async function persistLead(lead) {
  /*
    Replace with a real CRM/database write.

    Example:
      await crm.leads.create(lead)

    Keep this function idempotent if a client supplies an external ID.
  */

  return {
    saved: false,
    storage: "example-only",
    lead
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  const auth = verifyApiKey(req);

  if (!auth.ok) {
    return sendJson(res, 401, {
      ok: false,
      error: {
        code: auth.code,
        message: "API key is required before this endpoint can accept live submissions."
      }
    });
  }

  let payload;

  try {
    payload = await readJson(req);
  } catch (error) {
    return sendJson(res, 400, {
      ok: false,
      error: {
        code: "INVALID_JSON",
        message: "Request body must be valid JSON."
      }
    });
  }

  const errors = validatePayload(payload);

  if (errors.length) {
    return sendJson(res, 400, {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Lead submission failed validation.",
        fields: errors
      },
      compliance_message: "Only submit information you have permission to share. Do not submit sensitive borrower, banking, tax, credential, or private document data."
    });
  }

  const lead = normalizeLead(payload);
  const result = await persistLead(lead);

  return sendJson(res, 200, {
    ok: true,
    lead_id: lead.lead_id,
    status: lead.status,
    message: COMPLIANCE_MESSAGE,
    saved: result.saved,
    storage: result.storage,
    data: {
      partner_id: lead.partner_id,
      source: lead.source,
      created_at: lead.metadata.created_at
    }
  });
}
