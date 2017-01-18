/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var path = require("path");
var loaderUtils = require("loader-utils");
var processCss = require("./processCss");
var getImportPrefix = require("./getImportPrefix");
var compileExports = require("./compile-exports");
var camelCase = require("lodash.camelcase");


module.exports = function(content, map) {
	if(this.cacheable) this.cacheable();
	var callback = this.async();
	var query = loaderUtils.parseQuery(this.query);
	var root = query.root;
	var moduleMode = query.modules || query.module;
	var camelCaseKeys = query.camelCase || query.camelcase;

	if(map !== null && typeof map !== "string") {
		map = JSON.stringify(map);
	}

	processCss(content, map, {
		mode: moduleMode ? "local" : "global",
		from: loaderUtils.getRemainingRequest(this),
		to: loaderUtils.getCurrentRequest(this),
		query: query,
		minimize: this.minimize,
		loaderContext: this
	}, function(err, result) {
		if(err) return callback(err);

		var cssAsString = JSON.stringify(result.source);

		// for importing CSS
		var importUrlPrefix = getImportPrefix(this, query);

		var mediaQueries = [];
		var hash = require("crypto").createHash("md5");

		var importSymbols = result.importItems.reduce(function(data, imp) {
			if(!loaderUtils.isUrlRequest(imp.url, root)) {
				mediaQueries.push([
					"{\n" +
					"\t id: module.id,\n" +
					"\t content: " +  JSON.stringify("@import url(" + imp.url + ");") + ",\n" +
					"\t mediaQueries: []\n" +
					"}",
					JSON.stringify(imp.mediaQuery)
				]);
			} else {
				if (!data[imp.url]) {
					hash.update(imp.url);
					data[imp.url] = {
						default: false,
						hash: hash.digest("hex")
					};
				}
				if (imp.export) {
					data[imp.url].symbols = data[imp.url].symbols || []
					data[imp.url].symbols.push(imp.export);
				} else {
					data[imp.url].default = true;
				}
				mediaQueries.push([
					"$cssLoader" + data[imp.url].hash,
					imp.mediaQuery ? JSON.stringify(imp.mediaQuery) : undefined
				]);
			}

			return data;
		}, {});

		var seenMQ = {};
		mediaQueries = mediaQueries.filter(function(item) {
			return seenMQ.hasOwnProperty(item) ? false : (seenMQ[item] = true);
		});

		var importJs = Object.keys(importSymbols).map(function(url) {
			var importUrl = importUrlPrefix + url;
			var importDefault = importSymbols[url].default;
			var hash = importSymbols[url].hash;
			var symbols = importSymbols[url].symbols.map(function(symbol) {
				return camelCase(symbol);
			});

			var js = "import { $cssLoader as $cssLoader" + hash + " } from '" + importUrl + "';\n";
			if (symbols.length) {
				js = js + "import { " + symbols.join(", ") + " } from '" + importUrl + "';\n";
			}
			// Won't be used but enables tree shaking
			if (importDefault) {
				js = js + "import styles from '" + importUrl + "';\n";
			}
			return js;
		}).join('\n');

		function importItemMatcher(item) {
			var match = result.importItemRegExp.exec(item);
			var idx = +match[1];
			var importItem = result.importItems[idx];
			return "\" + " + camelCase(importItem.export) + " + \"";
		}

		cssAsString = cssAsString.replace(result.importItemRegExpG, importItemMatcher.bind(this));

		if(query.url !== false) {
			cssAsString = cssAsString.replace(result.urlItemRegExpG, function(item) {
				var match = result.urlItemRegExp.exec(item);
				var idx = +match[1];
				var urlItem = result.urlItems[idx];
				var url = urlItem.url;
				idx = url.indexOf("?#");
				if(idx < 0) idx = url.indexOf("#");
				var urlRequest;
				if(idx > 0) { // idx === 0 is catched by isUrlRequest
					// in cases like url('webfont.eot?#iefix')
					urlRequest = url.substr(0, idx);
					return "\" + require(" + loaderUtils.stringifyRequest(this, urlRequest) + ") + \"" +
							url.substr(idx);
				}
				urlRequest = url;
				return "\" + require(" + loaderUtils.stringifyRequest(this, urlRequest) + ") + \"";
			}.bind(this));
		}

		var exportJs = compileExports(result, importItemMatcher.bind(this), camelCaseKeys);

		var mediaQueriesJs;
		if (mediaQueries.length) {
			mediaQueriesJs = "let mediaQueries = [\n" + mediaQueries.map(function(query) {
				return "\t[" + query[0] + ", " + query[1] + "]";
			}).join(",\n") + 
			"\n];\n";
		} else {
			mediaQueriesJs = "let mediaQueries = [];\n";
		}

		var moduleJs;
		if(query.sourceMap && result.map) {
			// add a SourceMap
			map = result.map;
			if(map.sources) {
				map.sources = map.sources.map(function(source) {
					source = source.split("!").pop();
					var p = path.relative(query.context || this.options.context, source).replace(/\\/g, "/");
					if(p.indexOf("../") !== 0)
						p = "./" + p;
					return "/" + p;
				}, this);
				map.sourceRoot = "webpack://";
			}
			map.file = map.file.split("!").pop();
			map = JSON.stringify(map);
		}
		// CSS classnames can't begin with $ so namespace non-CSS exports here
		moduleJs = "export const $cssLoader = {\n" +
			"\t id: module.id,\n" +
			"\t content: " + cssAsString + ",\n" + 
			"\t mediaQueries: mediaQueries" +
			(query.sourceMap && result.map ? ",\n\t sourceMap: " + map : "") + 
			"\n}";

		var content = "//imports\n" + importJs + "\n\n" + 
			"// media queries\n" + mediaQueriesJs + "\n\n" +
			"// module\n" + moduleJs + "\n\n" +
			"// exports\n" + exportJs;

		// embed runtime
		callback(null, content);
	}.bind(this));
};
