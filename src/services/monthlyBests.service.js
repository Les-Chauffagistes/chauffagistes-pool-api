// services/monthlyBests.service.js
const { loadJsonSafe, saveJson } = require("./file.service");
const { MONTHLY_BESTS_FILE } = require("../config/paths");

function anonymizeAddress(addr = "") {
  if (typeof addr !== "string" || addr.length <= 7) return addr || "";
  return addr.slice(0, 5) + "…" + addr.slice(-2);
}

function toNumber(n, d = NaN) {
  const x = Number(n);
  return Number.isFinite(x) ? x : d;
}

function coerceToArray(raw) {
  // Déjà un tableau → ok
  if (Array.isArray(raw)) return raw;

  // Ancien format éventuel en objet { "2025-09": {sdiff, username, epoch}, ... }
  if (raw && typeof raw === "object") {
    return Object.entries(raw).map(([month, v]) => ({
      month,
      sdiff: toNumber(v?.sdiff ?? v, NaN),
      address: anonymizeAddress(v?.username || v?.address || ""),
      epoch: toNumber(v?.epoch, NaN),
    }));
  }

  // Fallback vide
  return [];
}

function isValidEntry(e) {
  return (
    e &&
    typeof e.month === "string" &&
    e.month.length >= 7 &&
    Number.isFinite(e.sdiff) &&
    Number.isFinite(e.epoch)
  );
}

async function mergeMonthlyBests(incoming = []) {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return { inserted: 0, updated: 0, total: 0 };
  }

  // ⚠️ mets bien [] en fallback (pas {}), et coercition si le contenu est au "mauvais" format
  const raw = await loadJsonSafe(MONTHLY_BESTS_FILE, []);
  const current = coerceToArray(raw).filter(isValidEntry);

  const byMonth = new Map(current.map(e => [e.month, e]));

  let inserted = 0;
  let updated = 0;

  for (const item of incoming) {
    const month = item?.month;
    const sdiff = toNumber(item?.sdiff, NaN);
    const username = item?.username || "";
    const epoch = toNumber(item?.epoch, NaN);

    if (!month || !Number.isFinite(sdiff) || !Number.isFinite(epoch)) continue;

    const existing = byMonth.get(month);
    if (!existing) {
      byMonth.set(month, {
        month,
        sdiff,
        address: anonymizeAddress(username),
        epoch,
      });
      inserted++;
    } else if (sdiff > toNumber(existing.sdiff, -Infinity)) {
      existing.sdiff = sdiff;
      existing.address = anonymizeAddress(username);
      existing.epoch = epoch;
      updated++;
    }
  }

  const out = Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month));
  await saveJson(MONTHLY_BESTS_FILE, out);
  return { inserted, updated, total: out.length };
}

module.exports = { mergeMonthlyBests };
