const fs = require("fs/promises");
const fss = require("fs");

exports.loadJsonSafe = async (file, fallback = {}) => {
  try {
    if (!fss.existsSync(file)) return fallback;
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw || "{}");
  } catch { return fallback; }
};

exports.saveJson = async (file, obj) => {
  await fs.writeFile(file, JSON.stringify(obj, null, 2));
};

exports.readTextSafe = async (file) => {
  try { return await fs.readFile(file, "utf8"); }
  catch (e) { if (e.code === "ENOENT") return null; throw e; }
};

exports.appendText = async (file, line) => fs.appendFile(file, line);
