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

    var composesCssText;
    var composesCssTextByUrl;
    if (query.cssText) {
      composesCssTextByUrl = {};
      composesCssText = [];
    }
    function importItemMatcher(item) {
      var match = result.importItemRegExp.exec(item);
      var idx = +match[1];
      var importItem = result.importItems[idx];
      var importUrl = importUrlPrefix + importItem.url;
      var url = JSON.stringify(importItem.url);
      if (!composesCssTextByUrl[url]) {
        composesCssText.push('require(' + url + ').__cssText__');
        composesCssTextByUrl[url] = true;
      }
      return "\" + require(" + url + ")" +
        "[" + JSON.stringify(importItem.export) + "] + \"";
    }

    var exportJs = compileExports(result, importItemMatcher.bind(this), camelCaseKeys);
    if (exportJs) {
      if (query.cssText) {
        if (composesCssText.length > 0) {
          composesCssText = ' + ' + composesCssText.join(' + ');
        }
        exportJs = exportJs.slice(0, -2) + ',\n\t"__cssText__": ' +
          JSON.stringify(result.source) + composesCssText + '\n}';
      }

      exportJs = "module.exports = " + exportJs + ";";

      if (query.cssText) {
        var context = this.context;
        exportJs = exportJs +
          "\nif (typeof window !== 'undefined') {" +
          "\n  require('style-loader/addStyles')([[module.id, module.exports.__cssText__]]);" +
          "\n}";
      }
    }


    callback(null, exportJs);
	}.bind(this));
};
