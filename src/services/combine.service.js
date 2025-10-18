// services/combine.service.js
const { loadJsonSafe, saveJson } = require("./file.service");
const { PRIMARY_DATA_FILE, BACKUP_DATA_FILE, DATA_FILE } = require("../config/paths");

/**
 * Sélectionne l'entrée avec sdiff max par mois.
 * Conserve month, sdiff, username, workername, epoch depuis l'entrée gagnante.
 */
function mergeMonthlyBestsArrays(a = [], b = []) {
  const byMonth = new Map();

  for (const src of [a, b]) {
    for (const it of src || []) {
      if (!it || !it.month) continue;
      const cur = byMonth.get(it.month);
      if (!cur || Number(it.sdiff) > Number(cur.sdiff)) {
        byMonth.set(it.month, {
          month: it.month,
          sdiff: Number(it.sdiff),
          username: it.username,
          workername: it.workername,
          epoch: it.epoch
        });
      }
    }
  }
  // Tri chrono croissant (optionnel)
  return Array.from(byMonth.values()).sort((x, y) => (x.month < y.month ? -1 : x.month > y.month ? 1 : 0));
}

/**
 * Retourne le max numérique entre 2 valeurs (tolérant NaN / null).
 */
function nmax(a, b) {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isNaN(na)) return nb;
  if (Number.isNaN(nb)) return na;
  return Math.max(na, nb);
}

/**
 * Copie profonde très light (pour éviter de muter les objets source).
 */
function clone(obj) {
  return obj ? JSON.parse(JSON.stringify(obj)) : obj;
}

/**
 * Merge des users: union des adresses; pour chaque adresse, on choisit
 * l'objet "base" venant de la source qui a le bestever le plus élevé,
 * puis on remonte bestever et bestshare à leur max respectif.
 */
function mergeUsers(primaryUsers = {}, backupUsers = {}) {
  const addresses = new Set([...Object.keys(primaryUsers || {}), ...Object.keys(backupUsers || {})]);
  const merged = {};

  for (const addr of addresses) {
    const p = primaryUsers[addr];
    const q = backupUsers[addr];

    if (p && !q) {
      merged[addr] = clone(p);
      continue;
    }
    if (!p && q) {
      merged[addr] = clone(q);
      continue;
    }

    // Les deux existent → choisir base avec bestever le plus haut
    const pBestEver = Number(p.bestever ?? p.bestshare ?? 0);
    const qBestEver = Number(q.bestever ?? q.bestshare ?? 0);
    const base = pBestEver >= qBestEver ? clone(p) : clone(q);
    const other = base === p ? q : p;

    // Monter bestever & bestshare au max
    const maxBestEver  = nmax(p.bestever,  q.bestever);
    const maxBestShare = nmax(p.bestshare, q.bestshare);

    if (!Number.isNaN(maxBestEver))  base.bestever  = maxBestEver;
    if (!Number.isNaN(maxBestShare)) base.bestshare = maxBestShare;

    // (Optionnel) si tu veux aussi “promouvoir” le worker qui a fait le bestever
    // il faudrait identifier quel worker est associé; on s’en tient ici à l’adresse.

    merged[addr] = base;
  }

  return merged;
}

/**
 * Construit un objet "combined" à partir des deux payloads.
 * On prend comme "base" la data active (passée en paramètre), puis on écrase/alimente:
 * - pool.shares.bestshare (max global),
 * - users (fusion par adresse, bestever/bestshare max),
 * - monthly_bests (par mois sdiff max).
 */
function buildCombined(activeData = {}, primary = {}, backup = {}) {
  const combined = clone(activeData) || {};

  // pool.shares.bestshare
  const pBest = primary?.pool?.shares?.bestshare;
  const bBest = backup?.pool?.shares?.bestshare;
  const maxPoolBest = nmax(pBest, bBest);
  if (!combined.pool) combined.pool = {};
  if (!combined.pool.shares) combined.pool.shares = {};
  if (!Number.isNaN(maxPoolBest)) {
    combined.pool.shares.bestshare = maxPoolBest;
  }

  // users (par adresse)
  combined.users = mergeUsers(primary?.users || {}, backup?.users || {});

  // monthly_bests
  combined.monthly_bests = mergeMonthlyBestsArrays(primary?.monthly_bests || [], backup?.monthly_bests || []);

  return combined;
}

/**
 * Lit primary + backup + (optionnellement) la data active, produit et écrit DATA_FILE fusionné.
 */
async function writeCombinedData(activeData = null) {
  const [primary, backup] = await Promise.all([
    loadJsonSafe(PRIMARY_DATA_FILE, {}),
    loadJsonSafe(BACKUP_DATA_FILE, {}),
  ]);

  const base = activeData || primary || {};
  const combined = buildCombined(base, primary, backup);
  await saveJson(DATA_FILE, combined);
  return combined;
}

module.exports = {
  mergeMonthlyBestsArrays,
  mergeUsers,
  buildCombined,
  writeCombinedData,
};
