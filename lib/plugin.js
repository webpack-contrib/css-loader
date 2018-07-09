var postcss = require("postcss");
var valueParser = require("postcss-value-parser");
var Tokenizer = require("css-selector-tokenizer");
var loaderUtils = require("loader-utils");

module.exports = postcss.plugin("css-loader-parser", function(options) {
  return function(css) {
    var importItems = [];
    var urlItems = [];

    if (options.import) {
      css.walkAtRules(/^import$/i, function(rule) {
        var values = Tokenizer.parseValues(rule.params);
        var url = values.nodes[0].nodes[0];
        if (url && url.type === "url") {
          url = url.url;
        } else if (url && url.type === "string") {
          url = url.value;
        } else throw rule.error("Unexpected format " + rule.params);
        if (!url.replace(/\s/g, "").length) {
          return;
        }
        values.nodes[0].nodes.shift();
        var mediaQuery = Tokenizer.stringifyValues(values);

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

    function processNode(item) {
      switch (item.type) {
        case "value":
          item.nodes.forEach(processNode);
          break;
        case "nested-item":
          item.nodes.forEach(processNode);
          break;
        case "url":
          if (
            options.url &&
            item.url.replace(/\s/g, "").length &&
            !/^#/.test(item.url) &&
            loaderUtils.isUrlRequest(item.url)
          ) {
            // Strip quotes, they will be re-added if the module needs them
            item.stringType = "";
            delete item.innerSpacingBefore;
            delete item.innerSpacingAfter;
            // For backward-compat after dropping css modules
            var url = loaderUtils.urlToRequest(item.url.trim());
            item.url = "___CSS_LOADER_URL___" + urlItems.length + "___";
            urlItems.push({
              url: url
            });
          }
          break;
      }
    }

    css.walkDecls(function(decl) {
      var values = Tokenizer.parseValues(decl.value);
      values.nodes.forEach(function(value) {
        value.nodes.forEach(processNode);
      });
      decl.value = Tokenizer.stringifyValues(values);
    });

    options.importItems = importItems;
    options.urlItems = urlItems;
  };
});
