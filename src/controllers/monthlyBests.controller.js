const { loadJsonSafe } = require("../services/file.service");
const { MONTHLY_BESTS_FILE } = require("../config/paths");

/**
 * GET /api/monthly_bests.json
 */
exports.getMonthlyBests = async (req, res, next) => {
  try {
    const data = await loadJsonSafe(MONTHLY_BESTS_FILE, []);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
