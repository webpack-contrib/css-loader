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

  var exportRules = {}
  Object.keys(result.exports).forEach(function(key) {
    var value = result.exports[key];
    var index = value.indexOf(" ")
    if (index > 0) value = value.slice(0, index);
    var rule = result.rules["."+value]

    var camelCaseRule = {};
    Object.keys(rule).forEach(function(key) {
      var value = rule[key];
      key = camelCase(key)
      camelCaseRule[key] = value;
    });

    if (/[\w_][\w\d_]*/.test(key)) {
      exportRules[key] = camelCaseRule;
    }
    if (camelCaseKeys === true) {
      var _key = camelCase(key);
      if (_key !== key) {
        exportRules[key] = camelCaseRule;
      }
    } else if (camelCaseKeys === 'dashes') {
      var _key = dashesCamelCase(key);
      if (_key !== key) {
        exportRules[key] = camelCaseRule;
      }
    }
  });

  var exportJs = Object.keys(result.exports).reduce(function(res, key) {
    var valueAsString = JSON.stringify(result.exports[key]);
    valueAsString = valueAsString.replace(result.importItemRegExpG, importItemMatcher);
    if (/[\w_][\w\d_]*/.test(key)) {
      res.push("\t" + JSON.stringify(key) + ": " + valueAsString);
    }
    if (camelCaseKeys === true) {
      var _key = camelCase(key);
      if (_key !== key) {
        res.push("\t" + JSON.stringify(_key) + ": " + valueAsString);
      }
    } else if (camelCaseKeys === 'dashes') {
      var _key = dashesCamelCase(key);
      if (_key !== key) {
        res.push("\t" + JSON.stringify(_key) + ": " + valueAsString);
      }
    }
    return res;
  }, ["\t\"__styles__\": " + JSON.stringify(exportRules)]).join(",\n");

  return "{\n" + exportJs + "\n}";
};
