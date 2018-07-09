/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var postcss = require("postcss");
var plugin = require("./plugin");
var CssLoaderError = require("./CssLoaderError");

module.exports = function processCss(inputSource, inputMap, options, callback) {
  var query = options.query;
  var parserOptions = {
    url: query.url !== false,
    import: query.import !== false,
    resolve: options.resolve
  };

  postcss([plugin(parserOptions)])
    .process(inputSource, {
      // we need a prefix to avoid path rewriting of PostCSS
      from: "/css-loader!" + options.from,
      to: options.to,
      map: options.sourceMap
        ? {
            prev: inputMap,
            sourcesContent: true,
            inline: false,
            annotation: false
          }
        : null
    })
    .then(function(result) {
      callback(null, {
        source: result.css,
        map: result.map && result.map.toJSON(),
        exports: parserOptions.exports,
        importItems: parserOptions.importItems,
        importItemRegExpG: /___CSS_LOADER_IMPORT___([0-9]+)___/g,
        importItemRegExp: /___CSS_LOADER_IMPORT___([0-9]+)___/,
        urlItems: parserOptions.urlItems,
        urlItemRegExpG: /___CSS_LOADER_URL___([0-9]+)___/g,
        urlItemRegExp: /___CSS_LOADER_URL___([0-9]+)___/
      });
    })
    .catch(function(error) {
      const preparedError =
        error.name === "CssSyntaxError"
          ? new CssLoaderError(
              "Syntax Error",
              error.reason,
              error.line != null && error.column != null
                ? { line: error.line, column: error.column }
                : null,
              error.input.source
            )
          : error;

      callback(preparedError);
    });
};
