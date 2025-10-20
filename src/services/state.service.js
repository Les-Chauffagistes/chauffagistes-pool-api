// services/state.service.js
const { loadJsonSafe, saveJson, readTextSafe, appendText } = require("./file.service");
const { STATE_FILE, PRIMARY_DATA_FILE, BACKUP_DATA_FILE, DATA_FILE, HASHRATE_FILE } = require("../config/paths");
const { FRESHNESS_MS } = require("../config/env");
const { writeCombinedData } = require("./combine.service"); // ⬅️ ajout
const fs = require("fs").promises;

const isFresh = (ts) => {
  if (!ts) return false;
  const t = new Date(ts).getTime();
  return !Number.isNaN(t) && (Date.now() - t) <= FRESHNESS_MS;
};

exports.updateAndPickActive = async (justUpdated = null) => {
  const state = await loadJsonSafe(STATE_FILE, {
    lastSeen: { primary: null, backup: null },
    activeSource: "none",
    lastSwitch: null
  });
  if (justUpdated) state.lastSeen[justUpdated] = new Date().toISOString();

  const primaryFresh = isFresh(state.lastSeen.primary);
  const backupFresh  = isFresh(state.lastSeen.backup);

  const nextActive = primaryFresh ? "primary" : (backupFresh ? "backup" : "none");
  if (nextActive !== state.activeSource) {
    state.activeSource = nextActive;
    state.lastSwitch = new Date().toISOString();
  }
  await saveJson(STATE_FILE, state);
  return state;
};

exports.getActiveData = async () => {
  const state = await loadJsonSafe(STATE_FILE, { activeSource: "none" });
  let data = {};
  if (state.activeSource === "primary") data = await loadJsonSafe(PRIMARY_DATA_FILE, {});
  else if (state.activeSource === "backup") data = await loadJsonSafe(BACKUP_DATA_FILE, {});
  return { state, data };
};

exports.syncCompatDataFile = async () => {
  const { state, data } = await this.getActiveData();
  if (state.activeSource === "none") return;

  // ⚠️ Au lieu d'écrire la data active brute, on écrit la vue combinée
  // (active comme base + fusion primary/backup pour monthly_bests, users best*, pool bestshare)
  await writeCombinedData(data);
};

exports.appendHashrateIfNeeded = async (hashrate, source, dateObj = new Date()) => {
  const today = dateObj.toISOString().slice(0, 10);
  const raw = await readTextSafe(HASHRATE_FILE);
  const lines = raw ? raw.split("\n").filter(Boolean) : [];
  const idx = lines.findIndex(l => l.split(";")[0] === today);

  const newLine = `${today};${hashrate};${source}`;

  if (idx === -1) {
    // Pas d’entrée aujourd’hui → on écrit
    await appendText(HASHRATE_FILE, newLine + "\n");
    return;
  }

  // Il existe déjà une ligne pour aujourd’hui → on remplace si différent
  const parts = lines[idx].split(";");
  const oldSrc = parts[2];
  const oldHashrate = parts[1];

  if (oldSrc !== source || oldHashrate !== String(hashrate)) {
    lines[idx] = newLine;
    await fs.writeFile(HASHRATE_FILE, lines.join("\n") + "\n", "utf8");
  }
};

exports.periodicSync = async () => {
  await this.updateAndPickActive(null);
  await this.syncCompatDataFile();
};
