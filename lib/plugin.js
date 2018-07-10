var postcss = require("postcss");
var valueParser = require("postcss-value-parser");
var Tokenizer = require("css-selector-tokenizer");
var loaderUtils = require("loader-utils");

module.exports = postcss.plugin("css-loader-parser", function(options) {
  return function(css) {
    const importItems = [];
    const urlItems = [];

    if (options.import) {
      css.walkAtRules(/^import$/i, function(rule) {
        const values = Tokenizer.parseValues(rule.params);
        let url = values.nodes[0].nodes[0];

        if (url && url.type === "url") {
          url = url.url;
        } else if (url && url.type === "string") {
          url = url.value;
        } else throw rule.error("Unexpected format " + rule.params);

        if (!url.replace(/\s/g, "").length) {
          return;
        }

        values.nodes[0].nodes.shift();

        const mediaQuery = Tokenizer.stringifyValues(values);

        if (loaderUtils.isUrlRequest(url)) {
          url = loaderUtils.urlToRequest(url);
        }

        importItems.push({
          url: url,
          mediaQuery: mediaQuery
        });
        rule.remove();
      });
    }

    if (options.url) {
      css.walkDecls(decl => {
        if (!decl.value.includes("url(")) {
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
            const URLValue = URLNode.value.trim().replace(/\\[\r\n]/, "");

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

            // Strip quotes, they will be re-added if the module needs them
            URLNode.quote = "";
            URLNode.value = "___CSS_LOADER_URL___" + urlItems.length + "___";

            urlItems.push({
              url: requestedURL
            });
          })
          .toString();

        return decl;
      });
    }

    options.importItems = importItems;
    options.urlItems = urlItems;
  };
});
