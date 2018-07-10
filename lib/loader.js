/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const loaderUtils = require("loader-utils");
const postcss = require("postcss");
const plugin = require("./plugin");
const getImportPrefix = require("./getImportPrefix");
const SyntaxError = require("./SyntaxError");

module.exports = function(content, map) {
  const options = loaderUtils.getOptions(this) || {};

  // Todo validate options

  const cb = this.async();
  const sourceMap = options.sourceMap;

  if (sourceMap && map) {
    if (typeof map === "string") {
      map = JSON.parse(map);
    }

    if (map.sources) {
      map.sources = map.sources.map(source => source.replace(/\\/g, "/"));
      map.sourceRoot = "";
    }
  } else {
    // Some loaders (example `"postcss-loader": "1.x.x"`) always generates source map, we should remove it
    map = null;
  }

  // We need a prefix to avoid path rewriting of PostCSS
  const from =
    "/css-loader!" +
    loaderUtils
      .getRemainingRequest(this)
      .split("!")
      .pop();
  const to = loaderUtils
    .getCurrentRequest(this)
    .split("!")
    .pop();

  postcss([
    plugin({
      url: options.url !== false,
      import: options.import !== false
    })
  ])
    .process(content, {
      from,
      to,
      map: sourceMap
        ? {
            prev: map,
            sourcesContent: true,
            inline: false,
            annotation: false
          }
        : null
    })
    .then(result => {
      var cssAsString = JSON.stringify(result.css);

      if (options.import !== false) {
        var alreadyImported = {};
        var importJs = result.messages
          .filter(message => message.type === "at-rule-import")
          .filter(imp => {
            if (!imp.mediaQuery) {
              if (alreadyImported[imp.url]) {
                return false;
              }

              alreadyImported[imp.url] = true;
            }

            return true;
          })
          .map(imp => {
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
            var importUrlPrefix = getImportPrefix(this, options);
            var importUrl = importUrlPrefix + imp.url;

            return (
              "exports.i(require(" +
              loaderUtils.stringifyRequest(this, importUrl) +
              "), " +
              JSON.stringify(imp.mediaQuery) +
              ");"
            );
          })
          .join("\n");
      }

      // Helper for ensuring valid CSS strings from requires
      let urlEscapeHelper = "";

      if (options.url !== false) {
        urlEscapeHelper =
          "var runtimeEscape = require(" +
          loaderUtils.stringifyRequest(
            this,
            require.resolve("./runtimeEscape.js")
          ) +
          ");\n";

        result.messages
          .filter(message => message.type === "css-loader-import-url")
          .forEach(message => {
            const { placeholder, url } = message;
            const splittedURL = url.split(/(\?)?#/);
            const importURLString =
              '" + runtimeEscape(require(' +
              loaderUtils.stringifyRequest(this, splittedURL[0]) +
              ')) + "' +
              (splittedURL[1] ? splittedURL[1] : "") +
              (splittedURL[2] ? `#${splittedURL[2]}` : "");

            cssAsString = cssAsString.replace(placeholder, importURLString);
          });
      }

      // Todo need save backward compatibility with old `style-loader`
      var exportJs = "";

      if (exportJs) {
        exportJs = "exports.locals = " + exportJs + ";";
      }

      var moduleJs;

      if (sourceMap && result.map) {
        map = result.map.toJSON();

        if (map.sources) {
          map.sources = map.sources.map(source =>
            source
              .split("!")
              .pop()
              .replace(/\\/g, "/")
          );
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
      cb(
        null,
        urlEscapeHelper +
          "exports = module.exports = require(" +
          loaderUtils.stringifyRequest(this, require.resolve("./runtime.js")) +
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
    .catch(err => {
      // Todo if (err.file) this.addDependency(err.file)

      cb(err.name === "CssSyntaxError" ? new SyntaxError(err) : err);
    });
};
