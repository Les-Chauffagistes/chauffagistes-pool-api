// src/controllers/graph.controller.js
const fs = require("fs/promises");
const { GRAPH_FILE } = require("../config/paths");
const { saveJson } = require("../services/file.service");

exports.graphWebhook = async (req, res, next) => {
  try {
    if (typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).send("Format JSON invalide");
    }
    await saveJson(GRAPH_FILE, req.body);
    res.send(`✅ graph.json mis à jour à ${new Date().toISOString()}`);
  } catch (e) { next(e); }
};

exports.getGraph = async (_req, res, next) => {
  try {
    const raw = await fs.readFile(GRAPH_FILE, "utf8").catch(e => {
      if (e.code === "ENOENT") return "{}";
      throw e;
    });
    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("Content-Type", "application/json");
    res.send(raw || "{}");
  } catch (e) { next(e); }
};
