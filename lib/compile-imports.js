var camelCase = require("./camelCase");
var loaderUtils = require("loader-utils");
var crypto = require("crypto");
var getImportPrefix = require("./getImportPrefix");

module.exports = function compileImports(result, loader, query, camelCaseKeys) {

	var importUrlPrefix = getImportPrefix(loader, query);

	var cssImports = [];

	var importSymbols = result.importItems.reduce(function(data, imp) {
		if(!loaderUtils.isUrlRequest(imp.url, query.root)) {
			var impQuery = imp.mediaQuery ? " " + imp.mediaQuery : "";
			cssImports.push([
				"{\n" +
				"\t id: module.id,\n" +
				"\t content: " +  JSON.stringify("@import url(" + imp.url + ")" + impQuery + ";") + ",\n" +
				"\t imports: []\n" +
				"}",
				undefined
			]);
		} else {
			if (!data[imp.url]) {
				var hash = crypto.createHash("md5");
				hash.update(imp.url);
				data[imp.url] = {
					default: false,
					hash: hash.digest("hex")
				};
			}
			if (imp.export) {
				data[imp.url].symbols = data[imp.url].symbols || [];
				data[imp.url].symbols.push(imp.export);
			} else {
				data[imp.url].default = true;
			}
			// Keep list of css imports and media queries
			cssImports.push([
				"$css" + data[imp.url].hash,
				imp.mediaQuery ? JSON.stringify(imp.mediaQuery) : undefined
			]);
		}

		return data;
	}, {});

	// dedupe css imports
	var seenImports = {};
	cssImports = cssImports.filter(function(item) {
		return Object.prototype.hasOwnProperty.call(seenImports, item) ? false : (seenImports[item] = true);
	});

	// Symbols imported from css + the css-base helper
	var importJs = "import cssBase from " + loaderUtils.stringifyRequest(loader, require.resolve("./css-base.js")) + ";\n" +
		Object.keys(importSymbols).map(function(url) {
			var importUrl = importUrlPrefix + url;
			var importDefault = importSymbols[url].default;
			var hash = importSymbols[url].hash;

			var js = "import { $css as $css" + hash + " } from " + JSON.stringify(importUrl) + ";\n";

			if (importSymbols[url].symbols) {
				// Prevent symbols from different sources clashing
				var symbols = importSymbols[url].symbols.map(function(symbol) {
					var camelCaseSymbol = camelCase(symbol, camelCaseKeys);
					return  camelCaseSymbol + " as " + camelCaseSymbol + hash;
				});
				if (symbols.length) {
					js = js + "import { " + symbols.join(", ") + " } from " + JSON.stringify(importUrl) + ";\n";
				}
			}

			if (importDefault) {
				js = js + "import styles" + hash + " from " + JSON.stringify(importUrl) + ";\n";
			}
			return js;
		}).join('\n');

	// List of css imports and their media queries
	var cssImportsJs;
	if (cssImports.length) {
		cssImportsJs = "const cssImports = [\n" + cssImports.map(function(imp) {
			return "\t[" + imp[0] + ", " + imp[1] + "]";
		}).join(",\n") +
			"\n];\n";
	} else {
		cssImportsJs = "const cssImports = [];\n";
	}

	return importJs + "\n" + cssImportsJs;
};
