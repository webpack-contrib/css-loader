import normalizeErrors from "./normalizeErrors";

export default (stats, shortError, type) => {
  return normalizeErrors(stats.compilation.errors, shortError, type).sort();
};
