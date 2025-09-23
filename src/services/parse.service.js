exports.parseHashrate = (value) => {
  if (typeof value !== "string") return null;
  const unit = value.slice(-1).toUpperCase();
  const number = parseFloat(value);
  if (Number.isNaN(number)) return null;
  const map = { H:1, K:1e3, M:1e6, G:1e9, T:1e12, P:1e15 };
  return map[unit] ? number * map[unit] : null;
};
exports.nowIso = () => new Date().toISOString();
