/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var path = require("path");
var loaderUtils = require("loader-utils");
var processCss = require("./processCss");
var compileImports = require("./compile-imports");
var compileExports = require("./compile-exports");
var camelCase = require("./camelCase");
var crypto = require("crypto");

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

		function importItemMatcher(item) {
			var match = result.importItemRegExp.exec(item);
			var idx = +match[1];
			var importItem = result.importItems[idx];
			var hash = crypto.createHash("md5");
			hash.update(importItem.url);

			// Prevent symbols from different source clashing
			var symbol = camelCase(importItem.export, camelCaseKeys) + hash.digest("hex");

			return "\" + " + symbol + " + \"";
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

		// for CSS imports
		var importJs = compileImports(result, this, query, camelCaseKeys);

		var exportJs = compileExports(result, importItemMatcher.bind(this), camelCaseKeys);

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
		// CSS classnames can't begin with $ so namespace non-CSS exports under $css
		moduleJs = "export const $css = {\n" +
			"\t id: module.id,\n" +
			"\t content: " + cssAsString + ",\n" + 
			"\t imports: cssImports" +
			(query.sourceMap && result.map ? ",\n\t sourceMap: " + map : "") + 
			"\n}";

		var content = "//imports\n" + importJs + "\n\n" + 
			"// module\n" + moduleJs + "\n\n" +
			"// exports\n" + exportJs;

		// embed runtime
		callback(null, content);
	}.bind(this));
};
