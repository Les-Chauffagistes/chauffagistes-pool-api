const { AUTH_TOKEN } = require("../config/env");
module.exports = (req, res, next) => {
  const auth = req.headers["authorization"];
  if (auth !== AUTH_TOKEN) return res.status(403).send("Accès interdit : Authorization invalide");
  next();
};
