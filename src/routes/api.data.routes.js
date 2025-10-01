// routes/data.routes.js
const router = require("express").Router();
const { apiLimiter } = require("../middlewares/limiter");
const { requireToken } = require("../middlewares/authApi");
const ctrl = require("../controllers/data.controller");

// GET /api/data/full  -> protégé par token + rate limiter
router.get("/api/data", apiLimiter, requireToken, ctrl.getFullData);

module.exports = router;
