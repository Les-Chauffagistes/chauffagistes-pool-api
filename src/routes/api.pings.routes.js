const router = require("express").Router();
const { apiLimiter } = require("../middlewares/limiter");
const ctrl = require("../controllers/pings.controller");
router.get("/api/pings", apiLimiter, ctrl.getPings);
module.exports = router;
