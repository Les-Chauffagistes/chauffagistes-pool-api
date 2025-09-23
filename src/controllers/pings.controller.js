const fs = require("fs");
const { PING_FILE } = require("../config/paths");

exports.getPings = (req, res) => {
  if (String(req.query.raw || "") === "1") {
    fs.readFile(PING_FILE, "utf8", (err, data) => {
      if (err) {
        if (err.code === "ENOENT") return res.status(404).send("Aucun ping disponible");
        return res.status(500).send("Erreur lecture pings.txt");
      }
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(data);
    });
    return;
  }

  fs.stat(PING_FILE, (statErr, stats) => {
    const updatedAt = (!statErr && stats) ? stats.mtime.toISOString() : null;

    fs.readFile(PING_FILE, "utf8", (err, data) => {
      if (err) {
        if (err.code === "ENOENT") return res.json({ updatedAt: null, hosts: [] });
        return res.status(500).json({ error: "Erreur lecture pings.txt" });
      }
      const lines = data.split("\n").map(l => l.trim()).filter(Boolean);
      const hosts = lines.map(line => {
        const sep = line.indexOf(" : ");
        if (sep === -1) return null;
        const name = line.slice(0, sep).trim();
        const value = line.slice(sep + 3).trim();

        if (!value || value.toLowerCase() === "offline") {
          return { name, online: false, latencyMs: null, raw: "offline" };
        }
        const match = value.match(/time\s*=\s*([\d.]+)\s*ms/i);
        const latencyMs = match ? Number(match[1]) : null;
        return { name, online: typeof latencyMs === "number" && !Number.isNaN(latencyMs), latencyMs, raw: value };
      }).filter(Boolean);

      res.json({
        updatedAt,
        total: hosts.length,
        online: hosts.filter(h => h.online).length,
        offline: hosts.filter(h => !h.online).length,
        hosts
      });
    });
  });
};
