var camelCase = require("lodash.camelcase");

function dashesCamelCase(str) {
  return str.replace(/-(\w)/g, function(match, firstLetter) {
    return firstLetter.toUpperCase();
  });
}

module.exports = function compileExports(result, importItemMatcher, camelCaseKeys) {
  if (!Object.keys(result.exports).length) {
    return "";
  }

  var symbols = [];
  var exportJs = Object.keys(result.exports).reduce(function(res, key) {
    var valueAsString = JSON.stringify(result.exports[key]);
    valueAsString = valueAsString.replace(result.importItemRegExpG, importItemMatcher);

    if (camelCaseKeys === true) {
      camelCaseKey = camelCase(key);
    } else if (camelCaseKeys === 'dashes') {
      camelCaseKey = dashesCamelCase(key);
    }
    res.push("export const " + camelCaseKey + " = " + valueAsString);
    symbols.push(camelCaseKey + ": " + camelCaseKey);

    return res;
  }, []);
  exportJs.push("export default { " + symbols.join(", ") + " };");

  return exportJs.join(";\n");
};
