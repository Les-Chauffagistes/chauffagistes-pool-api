const { loadJsonSafe, saveJson, readTextSafe, appendText } = require("./file.service");
const { STATE_FILE, PRIMARY_DATA_FILE, BACKUP_DATA_FILE, DATA_FILE, HASHRATE_FILE } = require("../config/paths");
const { FRESHNESS_MS } = require("../config/env");

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
  await saveJson(DATA_FILE, data);
};

exports.appendHashrateIfNeeded = async (hashrate, source, dateObj = new Date()) => {
  const today = dateObj.toISOString().slice(0, 10);
  const raw = await readTextSafe(HASHRATE_FILE);
  const lines = raw ? raw.split("\n").filter(Boolean) : [];
  const exists = lines.some(l => {
    const [d, , src] = l.split(";");
    return d === today;
  });
  if (!exists) {
    await appendText(HASHRATE_FILE, `${today};${hashrate};${source}\n`);
  }
};

exports.periodicSync = async () => {
  await this.updateAndPickActive(null);
  await this.syncCompatDataFile();
};
