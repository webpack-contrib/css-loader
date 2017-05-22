/* eslint-disable */

// CSS (Loader) Runtime
// TODO Update to ESM (if needed)
// @see css-loader/new-loader
module.exports = function (sourceMap) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var css = cssWithMappingToString(item, sourceMap);

      if (item[2]) return "@media " + item[2] + "{" + css + "}";

      return css;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function (modules, mediaQuery) {
    if(typeof modules === "string") modules = [[null, modules, ""]];

    var isImported = {};

    for (var i = 0; i < this.length; i++) {
      var id = this[i][0];

      if (typeof id === "number") isImported[id] = true;
    }

    for (i = 0; i < modules.length; i++) {
      var item = modules[i];
      // skip already imported module
      // this implementation is not 100% perfect for weird media query combos
      // when a module is imported multiple times with different media queries.
      // I hope this will never occur (Hey this way we have smaller bundles)
      if (typeof item[0] !== "number" || !isImported[item[0]]) {
        if (mediaQuery && !item[2]) item[2] = mediaQuery;
        else if (mediaQuery) {
          item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
        }

        list.push(item);
      }
    }
  };

  return list;
};

function cssWithMappingToString (item, sourceMap) {
  var css = item[1] || '';
  var map = item[3];

  if (!map) {
    return css;
  }

  if (sourceMap && typeof btoa === 'function') {
    var sourceMapping = toComment(map);

    var sourceURLs = map.sources.map(function (source) {
      return '/*# sourceURL=' + map.sourceRoot + source + ' */'
    });

    return [css].concat(sourceURLs).concat([sourceMapping]).join('\n');
  }

  return [css].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment (sourceMap) {
  // eslint-disable-next-line no-undef
  var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
  var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

  return '/*# ' + data + ' */';
}
