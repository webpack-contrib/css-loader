/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const loaderUtils = require("loader-utils");
const postcss = require("postcss");
const plugin = require("./plugin");
const getImportPrefix = require("./getImportPrefix");
const SyntaxError = require("./SyntaxError");

module.exports = function(content, map, meta) {
  const options = loaderUtils.getOptions(this) || {};

  // Todo validate options

  const cb = this.async();
  const sourceMap = options.sourceMap || false;

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

  // Reuse CSS AST (PostCSS AST e.g 'postcss-loader') to avoid reparsing
  if (meta) {
    const { ast } = meta;

    if (ast && ast.type === "postcss") {
      content = ast.root;
    }
  }

  const plugins = [
    plugin({
      url: options.url !== false,
      import: options.import !== false
    })
  ];

  const postcssOptions = {
    // We need a prefix to avoid path rewriting of PostCSS
    from:
      "/css-loader!" +
      loaderUtils
        .getRemainingRequest(this)
        .split("!")
        .pop(),
    to: loaderUtils
      .getCurrentRequest(this)
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
  };

  postcss(plugins)
    .process(content, postcssOptions)
    .then(result => {
      let cssAsString = JSON.stringify(result.css);
      let imports = "";
      let exports = "";
      let urlEscapeHelperCode = "";

      if (options.import !== false) {
        const alreadyImported = {};
        imports = result.messages
          .filter(message => message.type === "at-rule-import")
          .filter(message => {
            if (!message.mediaQuery) {
              if (alreadyImported[message.url]) {
                return false;
              }

              alreadyImported[message.url] = true;
            }

            return true;
          })
          .map(message => {
            if (!loaderUtils.isUrlRequest(message.url)) {
              return (
                "exports.push([module.id, " +
                JSON.stringify("@import url(" + message.url + ");") +
                ", " +
                JSON.stringify(message.mediaQuery) +
                "]);"
              );
            }

            // for importing CSS
            var importUrlPrefix = getImportPrefix(this, options);
            var importUrl = importUrlPrefix + message.url;

            return (
              "exports.i(require(" +
              loaderUtils.stringifyRequest(this, importUrl) +
              "), " +
              JSON.stringify(message.mediaQuery) +
              ");"
            );
          })
          .join("\n");
      }

      if (options.url !== false) {
        urlEscapeHelperCode =
          "var runtimeEscape = require(" +
          loaderUtils.stringifyRequest(
            this,
            require.resolve("./runtimeEscape.js")
          ) +
          ");\n";

        result.messages
          .filter(message => message.type === "function-url")
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
      }

      const runtimeCode = `module.exports = exports = require(${loaderUtils.stringifyRequest(
        this,
        require.resolve("./runtime.js")
      )})(${!!sourceMap});\n`;
      const moduleCode = `// CSS Module\nexports.push([module.id, ${cssAsString}, ""${
        map ? `,${map}` : ""
      }]);\n`;
      const importsCode = imports ? `// CSS Imports\n${imports}\n` : "";
      // Todo need save backward compatibility with old `style-loader` and exports.locals
      const exportsCode = exports ? `// CSS Exports\n${exports}\n` : false;

      cb(
        null,
        [
          urlEscapeHelperCode,
          runtimeCode,
          importsCode,
          moduleCode,
          exportsCode
        ].join("\n")
      );
    })
    .catch(err => {
      if (err.file) {
        this.addDependency(err.file);
      }

      cb(err.name === "CssSyntaxError" ? new SyntaxError(err) : err);
    });
};
