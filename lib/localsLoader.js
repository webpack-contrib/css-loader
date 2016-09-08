/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var path = require('path');
var loaderUtils = require("loader-utils");
var processCss = require("./processCss");
var getImportPrefix = require("./getImportPrefix");
var compileExports = require("./compile-exports");


module.exports = function(content) {
	if(this.cacheable) this.cacheable();
	var callback = this.async();
	var query = loaderUtils.parseQuery(this.query);
	var moduleMode = query.modules || query.module;
	var camelCaseKeys = query.camelCase || query.camelcase;

  processCss(content, null, {
    mode: moduleMode ? "local" : "global",
    query: query,
    minimize: this.minimize,
    loaderContext: this
  }, function(err, result) {
    if(err) return callback(err);

    // for importing CSS
    var importUrlPrefix = getImportPrefix(this, query);

    // composes 引入的模块
    var composesCssText;
    // byUrl 标识是否已经引入
    var composesCssTextByUrl;
    if (query.cssText) {
      composesCssText = [];
      composesCssTextByUrl = {};
    }
    function importItemMatcher(item) {
      var match = result.importItemRegExp.exec(item);
      var idx = +match[1];
      var importItem = result.importItems[idx];
      var importUrl = importUrlPrefix + importItem.url;
      var url = JSON.stringify(importItem.url);

      if (query.cssText) {
        if (!composesCssTextByUrl[url]) {
          composesCssText.push('require(' + url + ').toString()');
          composesCssTextByUrl[url] = true;
        }
      }

      return "\" + require(" + url + ")" + "[" + JSON.stringify(importItem.export) + "] + \"";
    }

    var exportJs = compileExports(result, importItemMatcher.bind(this), camelCaseKeys);
    var cssAsString;
    if (exportJs) {

      if (query.cssText) {
        cssAsString = JSON.stringify(result.source);
        cssAsString = cssAsString.replace(result.importItemRegExpG, importItemMatcher.bind(this));

        if (query.url !== false) {
          cssAsString = cssAsString.replace(result.urlItemRegExpG, function(item) {
            var match = result.urlItemRegExp.exec(item);
            var idx = +match[1];
            var urlItem = result.urlItems[idx];
            var url = JSON.stringify(urlItem.url);
            return '" + require(' + url + ') + "';
          });
        }

        if (composesCssText.length > 0) {
          composesCssText = composesCssText.join(' + ') + ' + ';
        }
        exportJs = exportJs.slice(0, -2) + ',\n' +
          '\ttoString: function toString() {\n' +
          '\t\treturn ' + composesCssText + cssAsString + ';\n' +
          '\t}\n' +
          '}';
      }

      exportJs = "module.exports = " + exportJs + ";";

      if (query.cssText) {
        var context = this.context;
        exportJs = exportJs +
          "\nif (typeof window !== 'undefined') {" +
          "\n  require('style-loader/addStyles')([[module.id, module.exports.toString()]]);" +
          "\n}";
      }
    }

    callback(null, exportJs);
	}.bind(this));
};
