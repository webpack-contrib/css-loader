import normalizeErrors from "./normalizeErrors";

export default (stats, shortError, type) =>
  normalizeErrors(stats.compilation.errors, shortError, type).sort();
