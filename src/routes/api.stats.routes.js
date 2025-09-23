const router = require("express").Router();
const { apiLimiter } = require("../middlewares/limiter");
const ctrl = require("../controllers/stats.controller");
router.get("/api/stats/:btcAddress", apiLimiter, ctrl.getStatsByAddress);
module.exports = router;
