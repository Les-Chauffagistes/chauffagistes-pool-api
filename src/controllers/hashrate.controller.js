const fs = require("fs");
const { HASHRATE_FILE } = require("../config/paths");

exports.getHashrate = (_req, res) => {
  fs.readFile(HASHRATE_FILE, "utf8", (err, raw) => {
    if (err) {
      if (err.code === "ENOENT") return res.json([]);
      return res.status(500).json({ error: "Erreur lecture fichier hashrate.txt" });
    }
    const lines = raw.split("\n").filter(Boolean);
    const data = lines.map(line => {
      const [date, hashrateStr] = line.split(";");
      return { date, hashrate: Number(hashrateStr) };
    });
    res.json(data);
  });
};
