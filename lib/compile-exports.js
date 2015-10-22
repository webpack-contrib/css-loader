var camelCase = require("lodash.camelcase");

module.exports = function compileExports(result, importItemMatcher, camelCaseKeys) {
  if (!Object.keys(result.exports).length) {
    return "";
  }

  var exportJs = Object.keys(result.exports).reduce(function(res, key) {
    var valueAsString = JSON.stringify(result.exports[key]);
    valueAsString = valueAsString.replace(result.importItemRegExpG, importItemMatcher);
    res.push("\t" + JSON.stringify(key) + ": " + valueAsString);
    if (camelCaseKeys) {
      res.push("\t" + JSON.stringify(camelCase(key)) + ": " + valueAsString);
    }
    return res;
  }, []).join(",\n");

  return "{\n" + exportJs + "\n}";
};
