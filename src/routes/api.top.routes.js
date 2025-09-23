const router = require("express").Router();
const { apiLimiter } = require("../middlewares/limiter");
const ctrl = require("../controllers/top.controller");

router.get("/api/top", apiLimiter, ctrl.getTop);

module.exports = router;
