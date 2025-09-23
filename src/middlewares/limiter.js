const rateLimit = require("express-rate-limit");

exports.webhookLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: "❌ Trop de requêtes (webhook)"
});

exports.apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1000,
  message: "⏳ Trop de requêtes API"
});
