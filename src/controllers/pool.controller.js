const fs = require("fs");
const { DATA_FILE } = require("../config/paths");

exports.getPool = (_req, res) => {
  fs.readFile(DATA_FILE, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Erreur lecture fichier" });
    try {
      const json = JSON.parse(data);
      res.json(json.pool || {});
    } catch { res.status(500).json({ error: "JSON invalide" }); }
  });
};
