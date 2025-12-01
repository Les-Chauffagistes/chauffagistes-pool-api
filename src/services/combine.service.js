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
 * Merge des users en partant de la data "active".
 *
 * - On garde TOUTES les infos (hashrate, shares, workers[], etc.)
 *   telles qu'elles sont dans activeUsers.
 * - On met à jour uniquement :
 *    - user.bestever  = max(bestever/bestshare sur active, primary, backup)
 *    - worker.bestever (par workername) = max(bestever/bestshare sur active, primary, backup)
 *
 * On n'ajoute pas de nouvelles adresses qui n'existent pas dans activeUsers :
 * le set d'adresses reste celui de la source active.
 */
function mergeUsers(activeUsers = {}, primaryUsers = {}, backupUsers = {}) {
  const merged = clone(activeUsers) || {};
  const addresses = Object.keys(merged);

  // petite helper pour faire un max sur une liste de valeurs numériques potentielles
  const maxOf = (...vals) => {
    let max = null;
    for (const v of vals) {
      const n = Number(v);
      if (Number.isNaN(n)) continue;
      if (max === null || n > max) max = n;
    }
    return max;
  };

  for (const addr of addresses) {
    const activeUser = merged[addr] || {};
    const p = primaryUsers[addr];
    const b = backupUsers[addr];

    // -------- bestever au niveau de l'adresse --------
    const bestEverUser = maxOf(
      activeUser.bestever,
      activeUser.bestshare, // fallback si bestever absent
      p && p.bestever,
      p && p.bestshare,
      b && b.bestever,
      b && b.bestshare
    );

    if (bestEverUser !== null) {
      activeUser.bestever = bestEverUser;
    }

    // -------- bestever au niveau des workers --------
    if (Array.isArray(activeUser.worker)) {
      for (const w of activeUser.worker) {
        const name = w.workername;

        const getWorkerByName = (user, workername) => {
          if (!user || !Array.isArray(user.worker)) return null;
          return user.worker.find(x => x.workername === workername) || null;
        };

        const pW = getWorkerByName(p, name);
        const bW = getWorkerByName(b, name);

        const bestEverWorker = maxOf(
          w.bestever,
          w.bestshare, // fallback
          pW && pW.bestever,
          pW && pW.bestshare,
          bW && bW.bestever,
          bW && bW.bestshare
        );

        if (bestEverWorker !== null) {
          w.bestever = bestEverWorker;
        }
      }
    }

    merged[addr] = activeUser;
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
  // on part de la data active (clone pour ne pas la muter)
  const combined = clone(activeData) || {};

  // pool.shares.bestshare → max global entre primary et backup (laisse le reste de pool tel quel)
  const pBest = primary?.pool?.shares?.bestshare;
  const bBest = backup?.pool?.shares?.bestshare;
  const maxPoolBest = nmax(pBest, bBest);
  if (!combined.pool) combined.pool = {};
  if (!combined.pool.shares) combined.pool.shares = {};
  if (!Number.isNaN(maxPoolBest)) {
    combined.pool.shares.bestshare = maxPoolBest;
  }

  // users → on garde la structure de activeData, on ne touche qu'aux bestever (user + workers)
  combined.users = mergeUsers(
    combined.users || {},
    primary?.users || {},
    backup?.users || {}
  );

  // monthly_bests → on garde ton merge par sdiff max
  combined.monthly_bests = mergeMonthlyBestsArrays(
    primary?.monthly_bests || [],
    backup?.monthly_bests || []
  );

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

  // activeData si fourni, sinon primary comme base
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
