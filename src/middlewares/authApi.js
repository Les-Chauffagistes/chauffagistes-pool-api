// middlewares/authApi.js
const { AUTH_API } = require("../config/env"); // ton fichier config/env.js

function requireToken(req, res, next) {
  // Récupère header Authorization ou token en query
  const authHeader = req.get("authorization") || "";
  const qToken = (req.query && req.query.token) ? String(req.query.token) : "";

  let provided = "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    provided = authHeader.slice(7);
  } else {
    provided = qToken;
  }

  // Normalise les deux valeurs (évite \n ou espaces)
  const expected = String(AUTH_API || "").trim();
  provided = String(provided || "").trim();

  // Debug (en dev seulement) — n'affiche pas le token réel en prod !
  if (process.env.NODE_ENV !== "production") {
    console.log(`[auth debug] provided="${provided}" expected_set=${expected !== ""}`);
  }

  if (!provided || provided !== expected) {
    return res.status(401).json({ error: "Unauthorized: invalid or missing token" });
  }
  return next();
}

module.exports = { requireToken };
