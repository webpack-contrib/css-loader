const postcss = require("postcss");
const valueParser = require("postcss-value-parser");
const loaderUtils = require("loader-utils");

const pluginName = "postcss-css-loader";

function getImportPrefix(loaderContext, importLoaders) {
  if (importLoaders === false) {
    return "";
  }

  const importLoadersValue = parseInt(importLoaders, 10) || 0;
  const loadersRequest = loaderContext.loaders
    .slice(
      loaderContext.loaderIndex,
      loaderContext.loaderIndex + 1 + importLoadersValue
    )
    .map(x => x.request)
    .join("!");

  return "-!" + loadersRequest + "!";
}

module.exports = postcss.plugin(pluginName, function(options) {
  return function(css, result) {
    if (options.import) {
      const alreadyImported = {};

      css.walkAtRules(/^import$/i, function(rule) {
        const parsedValue = valueParser(rule.params);

        if (!parsedValue.nodes || !parsedValue.nodes[0]) {
          throw rule.error("Unexpected format " + rule.params);
        }

        const firstNode = parsedValue.nodes[0];

        let url = null;

        if (
          firstNode.type === "function" &&
          firstNode.value.toLowerCase() === "url"
        ) {
          if (firstNode.nodes[0]) {
            firstNode.nodes[0].quote = "";
          }

          url = valueParser.stringify(firstNode.nodes);
        } else if (firstNode.type === "string") {
          url = firstNode.value;
        }

        if (url.replace(/\s/g, "").length === 0) {
          return;
        }

        const mediaQuery = valueParser
          .stringify(parsedValue.nodes.slice(1))
          .trim();

        let runtimeCode = "";

        if (loaderUtils.isUrlRequest(url)) {
          url = loaderUtils.urlToRequest(url);

          const importUrlPrefix = getImportPrefix(
            options.loaderContext,
            options.importLoaders
          );

          runtimeCode = `exports.i(require(${loaderUtils.stringifyRequest(
            options.loaderContext,
            importUrlPrefix + url
          )}), ${JSON.stringify(mediaQuery)});\n`;
        } else {
          runtimeCode = `exports.push([module.id, ${JSON.stringify(
            "@import url(" + url + ");"
          )}, ${JSON.stringify(mediaQuery)}]);`;
        }

        if (!alreadyImported[url]) {
          result.messages.push({
            pluginName,
            type: "modify-generated-code",
            modifyGeneratedCode: (loaderContext, contentObj) => {
              contentObj.runtime = `${contentObj.runtime}${runtimeCode}\n`;

              return contentObj;
            }
          });

          alreadyImported[url] = true;
        }

        rule.remove();
      });
    }

    if (options.url) {
      let index = 0;

      css.walkDecls(decl => {
        if (!/url\(/i.test(decl.value)) {
          return decl;
        }

        const parsedValue = valueParser(decl.value);

        decl.value = parsedValue
          .walk(node => {
            if (
              node.type !== "function" ||
              node.value.toLowerCase() !== "url" ||
              node.nodes.length === 0
            ) {
              return;
            }

            const urlNode = node.nodes[0];
            const url = urlNode.value.trim().replace(/\\[\r\n]/g, "");

            // Skip empty URLs
            // Empty URL function equals request to current stylesheet where it is declared
            if (url.length === 0) {
              return;
            }

            if (!loaderUtils.isUrlRequest(url)) {
              return;
            }

            // Remove spaces before and after
            node.before = "";
            node.after = "";

            const splittedURL = url.split(/(\?)?#/);
            const normalizedURL = splittedURL[0];

            const requestedURL = loaderUtils.urlToRequest(normalizedURL);
            const placeholder =
              "___CSS_LOADER_IMPORT_URL_PLACEHOLDER___" + index + "___";

            urlNode.value = placeholder;
            // Strip quotes, they will be re-added if the module needs them
            urlNode.quote = "";

            let hasURLEscapeRuntimeCode = false;

            result.messages.push({
              pluginName,
              type: "modify-generated-code",
              modifyGeneratedCode: (loaderContext, contentObj) => {
                if (!hasURLEscapeRuntimeCode) {
                  contentObj.imports = `var runtimeEscape = require(${loaderUtils.stringifyRequest(
                    loaderContext,
                    require.resolve("./runtimeEscape.js")
                  )});\n${contentObj.imports}`;

                  hasURLEscapeRuntimeCode = true;
                }

                contentObj.imports = `${
                  contentObj.imports
                }var ${placeholder} = require(${loaderUtils.stringifyRequest(
                  loaderContext,
                  requestedURL
                )});\n`;

                contentObj.module = contentObj.module.replace(
                  placeholder,
                  `" + runtimeEscape(${placeholder}) + "${
                    splittedURL[1] ? splittedURL[1] : ""
                  }${splittedURL[2] ? `#${splittedURL[2]}` : ""}`
                );

                return contentObj;
              }
            });

            index += 1;

            return false;
          })
          .toString();

        return decl;
      });
    }
  };
});
