// controllers/data.controller.js
const fs = require("fs");
const { PRIMARY_DATA_FILE } = require("../config/paths");

exports.getFullData = (_req, res) => {
  fs.readFile(PRIMARY_DATA_FILE, "utf8", (err, data) => {
    if (err) {
      console.error("Erreur lecture DATA_FILE:", err);
      return res.status(500).json({ error: "Erreur lecture fichier" });
    }
    try {
      const json = JSON.parse(data);
      // renvoie l'objet JSON complet
      return res.json(json);
    } catch (parseErr) {
      console.error("JSON invalide dans PRIMARY_DATA_FILE:", parseErr);
      return res.status(500).json({ error: "JSON invalide" });
    }
  });
};
