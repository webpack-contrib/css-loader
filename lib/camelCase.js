var camelCase = require("lodash.camelcase");

function dashesCamelCase(str) {
  return str.replace(/-(\w)/g, function(match, firstLetter) {
    return firstLetter.toUpperCase();
  });
}

module.exports = function(str, camelCaseKeys) {
  switch (camelCaseKeys) {
    case 'dashes':
      return dashesCamelCase(str);
    default:
      return camelCase(str);
  }
};
