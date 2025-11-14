const path = require("path");
const { saveJson } = require("../services/file.service");
const { updateAndPickActive, syncCompatDataFile, appendHashrateIfNeeded } = require("../services/state.service");
const { parseHashrate } = require("../services/parse.service");
const { PRIMARY_DATA_FILE, BACKUP_DATA_FILE } = require("../config/paths");
const { mergeMonthlyBests } = require("../services/monthlyBests.service");

exports.mainWebhook = async (req, res, next) => {
  try {
    const payload = req.body;
    const source = payload?.backup_pool ? "backup" : "primary";
    const targetFile = source === "primary" ? PRIMARY_DATA_FILE : BACKUP_DATA_FILE;

    await saveJson(targetFile, payload);

    // Met à jour l’état (fraîcheur + activeSource)
    const state = await updateAndPickActive(source);
    await syncCompatDataFile();

    // 🔹 Fusion monthly_bests si dispo
    const mb = await mergeMonthlyBests(payload?.monthly_bests);

    // 🔹 Parse hashrate
    const hashrate = parseHashrate(payload?.pool?.hashrates?.hashrate1d);
    if (hashrate == null) {
      return res.status(200).send(
        `ℹ️ Reçu (${source}), active=${state.activeSource} — pas de point hashrate — monthly_bests: +${mb.inserted} / ↑${mb.updated} (total ${mb.total})`
      );
    }

    // ⛔️ Ne pas mélanger : on n’append QUE si la source du payload est l'active
    if (source !== state.activeSource) {
      return res.status(200).send(
        `ℹ️ Reçu (${source}) mais active=${state.activeSource} — point ignoré pour éviter mélange des séries — monthly_bests: +${mb.inserted} / ↑${mb.updated} (total ${mb.total})`
      );
    }

    // ✅ Ici on sait que le point provient bien de la source active
    // Passe la VRAIE source du point (source), pas state.activeSource
    await appendHashrateIfNeeded(hashrate, source, new Date());

    res.send(
      `✅ Données enregistrées (${source}), active=${state.activeSource} — monthly_bests: +${mb.inserted} / ↑${mb.updated} (total ${mb.total})`
    );
  } catch (e) {
    next(e);
  }
};