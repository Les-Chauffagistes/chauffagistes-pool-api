const router = require("express").Router();
const { apiLimiter } = require("../middlewares/limiter");
const ctrl = require("../controllers/hashrate.controller");
router.get("/api/hashrate", apiLimiter, ctrl.getHashrate);
module.exports = router;
