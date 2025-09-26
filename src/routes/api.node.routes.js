const router = require("express").Router();
const { apiLimiter } = require("../middlewares/limiter");
const ctrl = require("../controllers/node.controller");

router.get("/api/node", apiLimiter, ctrl.getNode);

module.exports = router;
