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

  var exportJs = Object.keys(result.exports).reduce(function(res, key) {
    var valueAsString = JSON.stringify(result.exports[key]);
    valueAsString = valueAsString.replace(result.importItemRegExpG, importItemMatcher);
    function addEntry(k) {
      res.push("\t" + JSON.stringify(k) + ": " + valueAsString);
    }
    if (camelCaseKeys !== 'only' && camelCaseKeys !== 'dashesOnly') {
      addEntry(key);
    }

    var targetKey;
    if (camelCaseKeys === true || camelCaseKeys === 'only') {
      targetKey = camelCase(key);
      if (targetKey !== key) {
        addEntry(targetKey);
      }
    } else if (camelCaseKeys === 'dashes' || camelCaseKeys === 'dashesOnly') {
      targetKey = dashesCamelCase(key);
      if (targetKey !== key) {
        addEntry(targetKey);
      }
    }
    return res;
  }, []).join(",\n");

  return "{\n" + exportJs + "\n}";
};
