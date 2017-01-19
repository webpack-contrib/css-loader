/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var loaderUtils = require("loader-utils");
var processCss = require("./processCss");
var getImportPrefix = require("./getImportPrefix");
var compileExports = require("./compile-exports");
var camelCase = require("./camelCase");
var crypto = require("crypto");

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

		var importSymbols = result.importItems.reduce(function(data, imp) {
			if(loaderUtils.isUrlRequest(imp.url, query.root)) {
				if (imp.export) {
					if (!data[imp.url]) {
						var hash = crypto.createHash("md5");
						hash.update(imp.url);
						data[imp.url] = {
							default: false,
							hash: hash.digest("hex")
						};
					}
					data[imp.url].symbols = data[imp.url].symbols || [];
					data[imp.url].symbols.push(imp.export);
				}
			}
			return data;
		}, {});

		var importJs = Object.keys(importSymbols).map(function(url) {
			var importUrl = importUrlPrefix + url;
			var importDefault = importSymbols[url].default;
			var hash = importSymbols[url].hash;

			// Prevent symbols from different sources clashing
			var symbols = importSymbols[url].symbols.map(function(symbol) {
				var camelCaseSymbol = camelCase(symbol, camelCaseKeys);
				return  camelCaseSymbol + " as " + camelCaseSymbol + hash;
			});

			if (symbols.length) {
				return "import { " + symbols.join(", ") + " } from " + JSON.stringify(importUrl) + ";\n";
			}
			return "";
		}).join("");

		function importItemMatcher(item) {
			var match = result.importItemRegExp.exec(item);
			var idx = +match[1];
			var importItem = result.importItems[idx];
			var hash = crypto.createHash("md5");
			hash.update(importItem.url);

			// Prevent symbols from different sources clashing
			var symbol = camelCase(importItem.export, camelCaseKeys) + hash.digest("hex");

			return "\" + " + symbol + " + \"";
		}

		var exportJs = Object.keys(result.exports).reduce(function(res, key) {
			var valueAsString = JSON.stringify(result.exports[key]);
			valueAsString = valueAsString.replace(result.importItemRegExpG, importItemMatcher);

			camelCaseKey = camelCase(key, camelCaseKeys);

			return res + "export const " + camelCaseKey + " = " + valueAsString + ";\n";
		}, "");

		callback(null, importJs + "\n" + exportJs);
	}.bind(this));
};
