require("dotenv").config();

const parseList = (s) => (s || "")
  .split(",")
  .map(x => x.trim())
  .filter(Boolean);

module.exports = {
  PORT: Number(process.env.PORT || 3000),
  AUTH_TOKEN: process.env.AUTH_TOKEN,
  FRESHNESS_MS: Number(process.env.FRESHNESS_MS || 21 * 60 * 1000),
  SSL_KEY_PATH: process.env.SSL_KEY_PATH,
  SSL_CERT_PATH: process.env.SSL_CERT_PATH,
  CORS_ORIGINS: parseList(process.env.CORS_ORIGINS)
};
