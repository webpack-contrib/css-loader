var camelCase = require("./camelCase");
var reservedWords = require("reserved-words");

module.exports = function compileExports(result, importItemMatcher, camelCaseKeys) {
  if (!Object.keys(result.exports).length) {
    return "";
  }

  var symbols = [];
  var exportJs = Object.keys(result.exports).reduce(function(res, key) {
    var valueAsString = JSON.stringify(result.exports[key]);
    valueAsString = valueAsString.replace(result.importItemRegExpG, importItemMatcher);

    var camelCaseKey = camelCase(key, camelCaseKeys);

    if (camelCaseKeys && camelCaseKey !== key) {
      symbols.push(camelCaseKey + ": " + camelCaseKey);
    }

    if (!reservedWords.check(camelCaseKey, 'es2015')) {
      res.push("export const " + camelCaseKey + " = " + valueAsString);
      symbols.push(JSON.stringify(key) + ": " + camelCaseKey);
    } else {
      res.push("const $_" + camelCaseKey + " = " + valueAsString);
      symbols.push(JSON.stringify(key) + ": $_" + camelCaseKey);
    }

    return res;
  }, []);
  exportJs.push("export default cssBase({ " + symbols.join(", ") + " }, $css);");

  return exportJs.join(";\n");
};
