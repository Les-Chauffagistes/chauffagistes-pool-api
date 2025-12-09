const { AUTH_TOKEN } = require("../config/env");

module.exports = (req, res, next) => {
  const expected = String(AUTH_TOKEN || "").trim();
  if (!expected) {
    console.error("[authWebhook] AUTH_TOKEN non configuré : rejet systématique");
    return res.status(500).send("Configuration AUTH_TOKEN manquante");
  }

  const provided = String(req.headers["authorization"] || "").trim();
  if (!provided || provided !== expected) {
    return res.status(403).send("Accès interdit : Authorization invalide");
  }

  next();
};
