const fs = require("fs/promises");
const { DATA_FILE } = require("../config/paths");
const { parseHashrate } = require("../services/hashrate.service");

exports.getTop = async (req, res, next) => {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const json = JSON.parse(raw);
    const users = json.users || {};

    const userStats = Object.entries(users).map(([address, user]) => {
      const workers = user.worker || [];

      const totalHashrate = workers.reduce((sum, w) => {
        return sum + (parseHashrate(w.hashrate1hr) || 0);
      }, 0);

      const bestShare = workers.reduce((max, w) => {
        return Math.max(max, w.bestshare || 0);
      }, 0);

      return {
        address,
        shortAddress: address.slice(0, 5) + "..." + address.slice(-2),
        workerCount: workers.length,
        totalHashrate1hr: totalHashrate,
        bestshare: bestShare,
      };
    });

    const topBestShares = [...userStats]
      .sort((a, b) => b.bestshare - a.bestshare)
      .slice(0, 10)
      .map(u => ({
        address: u.shortAddress,
        workerCount: u.workerCount,
        bestshare: u.bestshare,
      }));

    const topHashrate = [...userStats]
      .sort((a, b) => b.totalHashrate1hr - a.totalHashrate1hr)
      .slice(0, 10)
      .map(u => ({
        address: u.shortAddress,
        workerCount: u.workerCount,
        totalHashrate1hr: u.totalHashrate1hr,
      }));

    res.json({ topBestShares, topHashrate });
  } catch (e) {
    if (e.code === "ENOENT") {
      return res.json({ topBestShares: [], topHashrate: [] });
    }
    next(e);
  }
};
