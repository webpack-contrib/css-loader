var postcss = require("postcss");
var valueParser = require("postcss-value-parser");
var Tokenizer = require("css-selector-tokenizer");
var loaderUtils = require("loader-utils");
var icssUtils = require("icss-utils");

module.exports = postcss.plugin("css-loader-parser", function(options) {
  return function(css) {
    var imports = {};
    var exports = {};
    var importItems = [];
    var urlItems = [];

    function replaceImportsInString(str) {
      if (options.import) {
        var tokens = valueParser(str);
        tokens.walk(function(node) {
          if (node.type !== "word") {
            return;
          }
          var token = node.value;
          var importIndex = imports["$" + token];
          if (typeof importIndex === "number") {
            node.value = "___CSS_LOADER_IMPORT___" + importIndex + "___";
          }
        });
        return tokens.toString();
      }
      return str;
    }

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

    var icss = icssUtils.extractICSS(css);
    exports = icss.icssExports;
    Object.keys(icss.icssImports).forEach(function(key) {
      var url = loaderUtils.parseString(key);
      Object.keys(icss.icssImports[key]).forEach(function(prop) {
        imports["$" + prop] = importItems.length;
        importItems.push({
          url: url,
          export: icss.icssImports[key][prop]
        });
      });
    });

    Object.keys(exports).forEach(function(exportName) {
      exports[exportName] = replaceImportsInString(exports[exportName]);
    });

    function processNode(item) {
      switch (item.type) {
        case "value":
          item.nodes.forEach(processNode);
          break;
        case "nested-item":
          item.nodes.forEach(processNode);
          break;
        case "item":
          var importIndex = imports["$" + item.name];
          if (typeof importIndex === "number") {
            item.name = "___CSS_LOADER_IMPORT___" + importIndex + "___";
          }
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
    css.walkAtRules(function(atrule) {
      if (typeof atrule.params === "string") {
        atrule.params = replaceImportsInString(atrule.params);
      }
    });

    options.importItems = importItems;
    options.urlItems = urlItems;
    options.exports = exports;
  };
});
