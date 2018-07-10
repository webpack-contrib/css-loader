const postcss = require("postcss");
const valueParser = require("postcss-value-parser");
const loaderUtils = require("loader-utils");

const pluginName = "postcss-css-loader";

module.exports = postcss.plugin(pluginName, function(options) {
  return function(css, result) {
    if (options.import) {
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

        if (loaderUtils.isUrlRequest(url)) {
          url = loaderUtils.urlToRequest(url);
        }

        const mediaQuery = valueParser
          .stringify(parsedValue.nodes.slice(1))
          .trim();

        result.messages.push({
          pluginName,
          type: "at-rule-import",
          url: url,
          mediaQuery: mediaQuery
        });

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

            const URLNode = node.nodes[0];
            const URLValue = URLNode.value.trim().replace(/\\[\r\n]/g, "");

            // Skip empty URLs
            // Empty URL function equals request to current stylesheet where it is declared
            if (URLValue.length === 0) {
              return;
            }

            if (!loaderUtils.isUrlRequest(URLValue)) {
              return;
            }

            // Remove spaces before and after
            node.before = "";
            node.after = "";

            const requestedURL = loaderUtils.urlToRequest(URLValue);
            const placeholder = "___CSS_LOADER_IMPORT_URL_PLACEHOLDER___" + index + "___";

            URLNode.value = placeholder;
            // Strip quotes, they will be re-added if the module needs them
            URLNode.quote = "";

            result.messages.push({
              pluginName,
              type: "function-url",
              placeholder: placeholder,
              url: requestedURL
            });

            index++;

            return false;
          })
          .toString();

        return decl;
      });
    }
  };
});
