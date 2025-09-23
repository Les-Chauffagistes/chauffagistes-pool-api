const path = require("path");
const ROOT = path.join(__dirname, "..", "..");

module.exports = {
  DATA_FILE:          path.join(ROOT, "data.json"),
  GRAPH_FILE:         path.join(ROOT, "graph.json"),
  PRIMARY_DATA_FILE:  path.join(ROOT, "data.primary.json"),
  BACKUP_DATA_FILE:   path.join(ROOT, "data.backup.json"),
  STATE_FILE:         path.join(ROOT, "state.json"),
  MONTHLY_BESTS_FILE: path.join(ROOT, "monthly_bests.json"),
  HASHRATE_FILE:      path.join(ROOT, "hashrate.txt"),
  PING_FILE:          "/home/debian/pings.txt"
};
