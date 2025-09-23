// src/routes/api.graph.routes.js
const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const authWebhook = require("../middlewares/authWebhook");
const graphCtrl = require("../controllers/graph.controller");

const graphLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  message: "⏳ Trop de requêtes pour graph.json, réessaye plus tard",
});

router.post("/webhook/graph", authWebhook, graphCtrl.graphWebhook);
router.get("/api/graph.json", graphLimiter, graphCtrl.getGraph);

module.exports = router;
