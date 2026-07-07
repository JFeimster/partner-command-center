// Partner Command Center response helpers
// Sprint 01: shared JSON response utilities for future server-side API routes.

'use strict';

function buildPayload(ok, status, body) {
  return {
    status,
    body: {
      ok,
      ...body
    }
  };
}

function success(data, meta) {
  return buildPayload(true, 200, {
    data: data || {},
    ...(meta ? { meta } : {})
  });
}

function created(data, meta) {
  return buildPayload(true, 201, {
    data: data || {},
    ...(meta ? { meta } : {})
  });
}

function validationError(message, details) {
  return buildPayload(false, 400, {
    error: {
      code: 'validation_error',
      message: message || 'Validation failed.',
      ...(details ? { details } : {})
    }
  });
}

function unauthorized(message) {
  return buildPayload(false, 401, {
    error: {
      code: 'unauthorized',
      message: message || 'Unauthorized request.'
    }
  });
}

function forbidden(message) {
  return buildPayload(false, 403, {
    error: {
      code: 'forbidden',
      message: message || 'Request is not allowed.'
    }
  });
}

function methodNotAllowed(method, allowedMethods) {
  return buildPayload(false, 405, {
    error: {
      code: 'method_not_allowed',
      message: `Method ${method || 'UNKNOWN'} is not allowed.`,
      allowed_methods: allowedMethods || []
    }
  });
}

function missingEnv(field) {
  return buildPayload(false, 500, {
    error: {
      code: 'missing_env',
      message: 'Missing required server environment variable.',
      field
    }
  });
}

function notionError(message, details) {
  return buildPayload(false, 502, {
    error: {
      code: 'notion_error',
      message: message || 'Notion request failed.',
      ...(details ? { details } : {})
    }
  });
}

function serverError(message, details) {
  return buildPayload(false, 500, {
    error: {
      code: 'server_error',
      message: message || 'Unexpected server error.',
      ...(details ? { details } : {})
    }
  });
}

function sendJson(res, response) {
  const status = response && response.status ? response.status : 200;
  const body = response && response.body ? response.body : response;

  if (!res || typeof res.status !== 'function') {
    return { status, body };
  }

  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(body));
}

module.exports = {
  buildPayload,
  success,
  created,
  validationError,
  unauthorized,
  forbidden,
  methodNotAllowed,
  missingEnv,
  notionError,
  serverError,
  sendJson
};
