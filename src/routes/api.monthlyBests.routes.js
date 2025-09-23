const router = require("express").Router();
const { apiLimiter } = require("../middlewares/limiter");
const ctrl = require("../controllers/monthlyBests.controller");

// Route API
router.get("/api/monthlyBests", apiLimiter, ctrl.getMonthlyBests);

module.exports = router;
