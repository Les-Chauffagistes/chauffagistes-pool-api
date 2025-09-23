const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const pinoHttp = require("pino-http")();
const { CORS_ORIGINS } = require("./config/env");
const { periodicSync } = require("./services/state.service");

const app = express();

// middlewares globaux
app.use(pinoHttp);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(cors({ origin: CORS_ORIGINS }));
app.use(compression());

// headers spécifiques /api/graph.json
app.use((req, res, next) => {
  if (req.path === "/api/graph.json") {
    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("Content-Type", "application/json");
  }
  next();
});

// routes
app.use("/webhook", require("./routes/webhook.routes"));
app.use(require("./routes/api.graph.routes"));
app.use(require("./routes/api.pool.routes"));
app.use(require("./routes/api.hashrate.routes"));
app.use(require("./routes/api.stats.routes"));
app.use(require("./routes/api.pings.routes"));
app.use(require("./routes/api.top.routes"));
app.use(require("./routes/api.monthlyBests.routes"));

// tâches périodiques
setInterval(periodicSync, 60 * 1000);

// 404 + erreurs
app.use(require("./middlewares/notFound"));
app.use(require("./middlewares/errorHandler"));

module.exports = app;
