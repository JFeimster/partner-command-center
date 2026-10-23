"use strict";

function isPartnerResourceId(value, allowedIds) {
  return typeof value === "string" && allowedIds.has(value);
}

function normalizePartnerResourceFavorites(value, allowedIds) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id) => isPartnerResourceId(id, allowedIds)))];
}

module.exports = { isPartnerResourceId, normalizePartnerResourceFavorites };
