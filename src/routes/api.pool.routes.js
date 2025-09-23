const router = require("express").Router();
const { apiLimiter } = require("../middlewares/limiter");
const ctrl = require("../controllers/pool.controller");
router.get("/api/pool", apiLimiter, ctrl.getPool);
module.exports = router;
