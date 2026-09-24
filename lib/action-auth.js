'use strict';

const crypto = require('crypto');

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function getHeader(req, name) {
  const headers = req && req.headers ? req.headers : {};
  const key = Object.keys(headers).find((item) => item.toLowerCase() === name.toLowerCase());
  const value = key ? headers[key] : '';
  return Array.isArray(value) ? value[0] : value || '';
}

function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function isAuthorized(req) {
  const expected = process.env.PARTNER_COMMAND_API_KEY;
  const provided = getHeader(req, 'x-api-key') || getHeader(req, 'authorization').replace(/^Bearer\s+/i, '');
  return Boolean(expected && provided && constantTimeEqual(provided, expected));
}

function parseBody(req) {
  if (!req || req.body === undefined || req.body === null || req.body === '') return {};
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body;
}

module.exports = { clean, getHeader, constantTimeEqual, isAuthorized, parseBody };
