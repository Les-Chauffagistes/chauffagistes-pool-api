const fs = require("fs");
const { DATA_FILE } = require("../config/paths");

exports.getStatsByAddress = (req, res) => {
  const address = req.params.btcAddress;
  fs.readFile(DATA_FILE, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Erreur lecture fichier" });
    try {
      const json = JSON.parse(data);
      const user = json.users?.[address];
      if (!user) return res.status(404).json({ error: "Adresse introuvable" });

      const globalStats = {
        hashrate1m: user.hashrate1m,
        hashrate5m: user.hashrate5m,
        hashrate1hr: user.hashrate1hr,
        hashrate1d: user.hashrate1d,
        hashrate7d: user.hashrate7d,
        shares: user.shares,
        bestshare: user.bestshare,
        workers: user.workers
      };

      res.json({ address, globalStats, workers: user.worker || [] });
    } catch { res.status(500).json({ error: "JSON invalide" }); }
  });
};
