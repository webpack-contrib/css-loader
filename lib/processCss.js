/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var formatCodeFrame = require("babel-code-frame");
var postcss = require("postcss");
var plugin = require("./plugin");

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
    .catch(function(err) {
      if (err.name === "CssSyntaxError") {
        var wrappedError = new CSSLoaderError(
          "Syntax Error",
          err.reason,
          err.line != null && err.column != null
            ? { line: err.line, column: err.column }
            : null,
          err.input.source
        );
        callback(wrappedError);
      } else {
        callback(err);
      }
    });
};

function formatMessage(message, loc, source) {
  var formatted = message;
  if (loc) {
    formatted = formatted + " (" + loc.line + ":" + loc.column + ")";
  }
  if (loc && source) {
    formatted =
      formatted + "\n\n" + formatCodeFrame(source, loc.line, loc.column) + "\n";
  }
  return formatted;
}

function CSSLoaderError(name, message, loc, source, error) {
  Error.call(this);
  Error.captureStackTrace(this, CSSLoaderError);
  this.name = name;
  this.error = error;
  this.message = formatMessage(message, loc, source);
  this.hideStack = true;
}

CSSLoaderError.prototype = Object.create(Error.prototype);
CSSLoaderError.prototype.constructor = CSSLoaderError;
