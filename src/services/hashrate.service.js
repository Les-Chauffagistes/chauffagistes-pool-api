exports.parseHashrate = function (value) {
  if (typeof value !== "string") return null;
  const unit = value.slice(-1).toUpperCase();
  const number = parseFloat(value);
  if (isNaN(number)) return null;

  switch (unit) {
    case "H": return number;
    case "K": return number * 1e3;
    case "M": return number * 1e6;
    case "G": return number * 1e9;
    case "T": return number * 1e12;
    case "P": return number * 1e15;
    default:  return null;
  }
};
