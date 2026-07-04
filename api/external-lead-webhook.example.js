/*
  Moonshine Partner Command Center
  API Example — external-lead-webhook.example.js

  Future endpoint:
    POST /api/external-lead-webhook

  Status:
    Example only. Demonstrates webhook envelope validation, signature checks,
    idempotency, and safe event handling.

  Production requirements:
    - HMAC signature verification
    - Timestamp tolerance
    - Idempotency storage
    - Schema validation
    - Rate limiting
    - Audit logging
    - Dead-letter queue for failures
*/

import crypto from "node:crypto";

const ALLOWED_EVENTS = [
  "widget.inquiry.created",
  "lead.status.updated",
  "partner.link.clicked",
  "compliance.copy.flagged"
];

const COMPLIANCE_MESSAGE =
  "Webhook accepted for processing. This does not guarantee approval, funding, commissions, income, or any business outcome.";

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

async function readRawBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function safeParseJson(raw) {
  try {
    return {
      ok: true,
      data: JSON.parse(raw)
    };
  } catch (error) {
    return {
      ok: false,
      error
    };
  }
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function verifySignature(req, rawBody) {
  /*
    Replace with your real secret:
      const secret = process.env.MOONSHINE_WEBHOOK_SECRET;

    Signature format example:
      X-Moonshine-Signature: sha256=<hmac>
  */

  const secret = process.env.MOONSHINE_WEBHOOK_SECRET || "example-dev-secret";
  const received = req.headers["x-moonshine-signature"];

  if (!received) {
    return {
      ok: false,
      code: "MISSING_SIGNATURE"
    };
  }

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expected = `sha256=${digest}`;

  if (!timingSafeEqualString(received, expected)) {
    return {
      ok: false,
      code: "INVALID_SIGNATURE"
    };
  }

  return {
    ok: true
  };
}

function validateEnvelope(payload) {
  const errors = [];

  if (!payload || typeof payload !== "object") errors.push("payload");
  if (!payload.event_id) errors.push("event_id");
  if (!payload.event_type) errors.push("event_type");
  if (!payload.created_at) errors.push("created_at");
  if (!payload.source) errors.push("source");
  if (!payload.data || typeof payload.data !== "object") errors.push("data");

  if (payload.event_type && !ALLOWED_EVENTS.includes(payload.event_type)) {
    errors.push("event_type");
  }

  return errors;
}

async function isDuplicateEvent(eventId) {
  /*
    Replace with durable idempotency check.

    Example:
      return await db.webhookEvents.exists(eventId)
  */

  return false;
}

async function storeWebhookEvent(payload) {
  /*
    Replace with durable event storage and processing.

    Recommended:
      1. Store raw payload.
      2. Mark status: received.
      3. Queue processing.
      4. Mark status: processed or failed.
  */

  return {
    stored: false,
    storage: "example-only",
    event_id: payload.event_id
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  const rawBody = await readRawBody(req);
  const signature = verifySignature(req, rawBody);

  if (!signature.ok) {
    return sendJson(res, 401, {
      ok: false,
      error: {
        code: signature.code,
        message: "Webhook signature verification failed."
      }
    });
  }

  const parsed = safeParseJson(rawBody);

  if (!parsed.ok) {
    return sendJson(res, 400, {
      ok: false,
      error: {
        code: "INVALID_JSON",
        message: "Webhook body must be valid JSON."
      }
    });
  }

  const payload = parsed.data;
  const errors = validateEnvelope(payload);

  if (errors.length) {
    return sendJson(res, 400, {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Webhook envelope failed validation.",
        fields: errors
      }
    });
  }

  const duplicate = await isDuplicateEvent(payload.event_id);

  if (duplicate) {
    return sendJson(res, 200, {
      ok: true,
      duplicate: true,
      event_id: payload.event_id,
      message: "Duplicate webhook ignored."
    });
  }

  const result = await storeWebhookEvent(payload);

  return sendJson(res, 200, {
    ok: true,
    received: true,
    event_id: payload.event_id,
    event_type: payload.event_type,
    stored: result.stored,
    storage: result.storage,
    message: COMPLIANCE_MESSAGE
  });
}
