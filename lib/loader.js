/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/

const schema = require("./options.json");
const validate = require("@webpack-contrib/schema-utils");
const loaderUtils = require("loader-utils");
const postcss = require("postcss");
const plugin = require("./plugin");
const SyntaxError = require("./SyntaxError");

module.exports = function(content, map, meta) {
  const options = loaderUtils.getOptions(this) || {};

  validate({ name: "CSS Loader", schema, target: options });

  const cb = this.async();
  const { url, import: importOpt, sourceMap, importLoaders } = Object.assign(
    {},
    { url: true, import: true, sourceMap: false, importLoaders: 0 },
    loaderUtils.getOptions(this) || {}
  );

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
      loaderContext: this,
      url,
      import: importOpt,
      importLoaders
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
      if (meta && meta.messages) {
        result.messages = result.messages.concat(meta.messages);
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

      // Todo need save backward compatibility with old `style-loader` and exports.locals
      let newContentObj = {
        imports: "",
        runtime: `module.exports = exports = require(${loaderUtils.stringifyRequest(
          this,
          require.resolve("./runtime.js")
        )})(${!!sourceMap});\n`,
        module: `exports.push([module.id, ${JSON.stringify(result.css)}, ""${
          map ? `,${map}` : ""
        }]);\n`,
        exports: ""
      };

      if (result.messages && result.messages.length > 0) {
        result.messages
          .filter(message => (message.type === "modify-code" ? message : false))
          .forEach(message => {
            try {
              newContentObj = message.modifyCode(this, newContentObj);
            } catch (err) {
              this.emitError(err);
            }
          });
      }

      const { imports, runtime, module, exports } = newContentObj;

      cb(
        null,
        [
          imports ? `// CSS imports\n${imports}` : "",
          runtime ? `// CSS runtime\n${runtime}` : "",
          module ? `// CSS module\n${module}` : "",
          exports ? `// CSS exports\n${exports}` : ""
        ].join("\n")
      );

      return;
    })
    .catch(err => {
      if (err.file) {
        this.addDependency(err.file);
      }

      cb(err.name === "CssSyntaxError" ? new SyntaxError(err) : err);

      return;
    });
};
