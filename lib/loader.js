/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var loaderUtils = require("loader-utils");
var postcss = require("postcss");
var plugin = require("./plugin");
var getImportPrefix = require("./getImportPrefix");
var CssLoaderError = require("./CssLoaderError");

module.exports = function(content, map) {
  var callback = this.async();
  var query = loaderUtils.getOptions(this) || {};
  var sourceMap = query.sourceMap || false;
  var loaderContext = this;

  if (sourceMap) {
    if (map) {
      if (typeof map === "string") {
        map = JSON.stringify(map);
      }

      if (map.sources) {
        map.sources = map.sources.map(function(source) {
          return source.replace(/\\/g, "/");
        });
        map.sourceRoot = "";
      }
    }
  } else {
    // Some loaders (example `"postcss-loader": "1.x.x"`) always generates source map, we should remove it
    map = null;
  }

  var parserOptions = {
    url: query.url !== false,
    import: query.import !== false,
    resolve: loaderContext.resolve
  };

  postcss([plugin(parserOptions)])
    .process(content, {
      // we need a prefix to avoid path rewriting of PostCSS
      from:
        "/css-loader!" +
        loaderUtils
          .getRemainingRequest(loaderContext)
          .split("!")
          .pop(),
      to: loaderUtils
        .getCurrentRequest(loaderContext)
        .split("!")
        .pop(),
      map: sourceMap
        ? {
            prev: map,
            sourcesContent: true,
            inline: false,
            annotation: false
          }
        : null
    })
    .then(function(result) {
      var cssAsString = JSON.stringify(result.css);
      var importItems = parserOptions.importItems;

      if (query.import !== false && importItems.length > 0) {
        var alreadyImported = {};
        var importJs = importItems
          .filter(function(imp) {
            if (!imp.mediaQuery) {
              if (alreadyImported[imp.url]) {
                return false;
              }

              alreadyImported[imp.url] = true;
            }

            return true;
          })
          .map(function(imp) {
            if (!loaderUtils.isUrlRequest(imp.url)) {
              return (
                "exports.push([module.id, " +
                JSON.stringify("@import url(" + imp.url + ");") +
                ", " +
                JSON.stringify(imp.mediaQuery) +
                "]);"
              );
            }

            // for importing CSS
            var importUrlPrefix = getImportPrefix(loaderContext, query);
            var importUrl = importUrlPrefix + imp.url;

            return (
              "exports.i(require(" +
              loaderUtils.stringifyRequest(this, importUrl) +
              "), " +
              JSON.stringify(imp.mediaQuery) +
              ");"
            );
          }, loaderContext)
          .join("\n");
      }

      // helper for ensuring valid CSS strings from requires
      var urlEscapeHelper = "";
      var urlItems = parserOptions.urlItems;

      if (query.url !== false && urlItems.length > 0) {
        urlEscapeHelper =
          "var escape = require(" +
          loaderUtils.stringifyRequest(
            loaderContext,
            require.resolve("./url/escape.js")
          ) +
          ");\n";

        cssAsString = cssAsString.replace(
          /___CSS_LOADER_URL___([0-9]+)___/g,
          function(item) {
            var match = /___CSS_LOADER_URL___([0-9]+)___/.exec(item);
            var idx = +match[1];
            var urlItem = urlItems[idx];
            var url = urlItem.url;

            idx = url.indexOf("?#");

            if (idx < 0) {
              idx = url.indexOf("#");
            }

            var urlRequest;

            if (idx > 0) {
              // idx === 0 is catched by isUrlRequest
              // in cases like url('webfont.eot?#iefix')
              urlRequest = url.substr(0, idx);

              return (
                '" + escape(require(' +
                loaderUtils.stringifyRequest(loaderContext, urlRequest) +
                ')) + "' +
                url.substr(idx)
              );
            }

            urlRequest = url;

            return (
              '" + escape(require(' +
              loaderUtils.stringifyRequest(loaderContext, urlRequest) +
              ')) + "'
            );
          }
        );
      }

      // Todo need save backward compatibility with old `style-loader`
      var exportJs = "";

      if (exportJs) {
        exportJs = "exports.locals = " + exportJs + ";";
      }

      var moduleJs;

      if (sourceMap && result.map) {
        // add a SourceMap
        map = result.map.toJSON();

        if (map.sources) {
          map.sources = map.sources.map(function(source) {
            return source
              .split("!")
              .pop()
              .replace(/\\/g, "/");
          }, loaderContext);
          map.sourceRoot = "";
        }

        map.file = map.file
          .split("!")
          .pop()
          .replace(/\\/g, "/");
        map = JSON.stringify(map);

        moduleJs =
          "exports.push([module.id, " + cssAsString + ', "", ' + map + "]);";
      } else {
        moduleJs = "exports.push([module.id, " + cssAsString + ', ""]);';
      }

      // embed runtime
      callback(
        null,
        urlEscapeHelper +
          "exports = module.exports = require(" +
          loaderUtils.stringifyRequest(
            loaderContext,
            require.resolve("./runtime.js")
          ) +
          ")(" +
          sourceMap +
          ");\n" +
          "// imports\n" +
          importJs +
          "\n\n" +
          "// module\n" +
          moduleJs +
          "\n\n" +
          "// exports\n" +
          exportJs
      );
    })
    .catch(function(error) {
      callback(
        error.name === "CssSyntaxError"
          ? new CssLoaderError(
              "Syntax Error",
              error.reason,
              error.line != null && error.column != null
                ? { line: error.line, column: error.column }
                : null,
              error.input.source
            )
          : error
      );
    });
};
