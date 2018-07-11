/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/

const loaderUtils = require("loader-utils");
const postcss = require("postcss");
const plugin = require("./plugin");
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
      import: options.import !== false,
      loaderContext: this,
      importLoaders: options.importLoaders
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
      let newContent = {
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
        newContent = result.messages
          .filter(
            message =>
              message.type === "modify-runtime-code" ? message : false
          )
          .reduce((initialValue, message) => {
            try {
              initialValue = message.modifyRuntimeCode(this, initialValue);
            } catch (err) {
              this.emitError(err);
            }

            return initialValue;
          }, newContent);
      }

      const { imports, runtime, module, exports } = newContent;

      cb(
        null,
        [
          imports ? `// CSS imports\n${imports}` : "",
          runtime ? `// CSS runtime\n${runtime}` : "",
          module ? `// CSS module\n${newContent.module}` : "",
          exports ? `// CSS exports\n${newContent.exports}` : ""
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
