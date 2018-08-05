/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var path = require("path");
var loaderUtils = require("loader-utils");
var processCss = require("./processCss");
var getImportPrefix = require("./getImportPrefix");
var compileExports = require("./compile-exports");

/**
 * If the file was "renamed" (for the purposes of source maps), then honor it,
 * otherwise just use the resourcePath.
 * @param {String} resourcePath - The absolute file system path for the sass file.
 * @param {Object|null} map - An existing source map, if any.
 * @return {String} - The effective path to use for the `from` argument.
 */
function processFrom(resourcePath, map) {
	var effectiveResourcePath;
	if (map && map.file && typeof map.file === 'string' && path.dirname(map.file) === '.') {
		// Something else has already changed the file name or extension, so
		// honor it for the purpose of creating the next source map.
		effectiveResourcePath = path.join(path.dirname(resourcePath), map.file);
	} else {
		effectiveResourcePath = resourcePath;
	}
	return effectiveResourcePath;
}

module.exports = function(content, map) {
	var callback = this.async();
	var query = loaderUtils.getOptions(this) || {};
	var moduleMode = query.modules;
	var camelCaseKeys = query.camelCase;
	var sourceMap = query.sourceMap || false;
	var processCssFrom;
	var processCssTo;

	if(sourceMap) {
		if (map) {
			if (typeof map === "string") {
				map = JSON.stringify(map);
			}

			if (map.sources) {
				map.sources = map.sources.map(function (source) {
					return source.replace(/\\/g, '/');
				});
				map.sourceRoot = '';
			}
		}
	} else {
		// Some loaders (example `"postcss-loader": "1.x.x"`) always generates source map, we should remove it
		map = null;
	}

	/**
	 * > To ensure that PostCSS generates source maps and displays better syntax
	 * > errors, runners must specify the from and to options. If your runner
	 * > does not handle writing to disk (for example, a gulp transform), you
	 * > should set both options to point to the same file
	 * @see postcss [PostCSS Runner Guidelines]{@link https://github.com/postcss/postcss/blob/master/docs/guidelines/runner.md#21-set-from-and-to-processing-options}
	 *
	 * `css-loader` isn't responsible for writing the map, so it doesn't have to
	 * worry about updating the map with a transformation that changes locations
	 * (suchs as map.file or map.sources).
	 *
	 * Changing the file extension counts as changing the location because it
	 * changes the path.
	 *
	 * PostCSS's `from` and `to` arguments are only concerned with the file
	 * system. They don't know about, care about, or understand the webpack
	 * loader's current request or remaining request.
	 */
	processCssFrom = processFrom(this.resourcePath, map);
	processCssTo = processCssFrom;

	processCss(content, map, {
		mode: moduleMode ? "local" : "global",
		from: processCssFrom,
		to: processCssTo,
		query: query,
		loaderContext: this,
		sourceMap: sourceMap
	}, function(err, result) {
		if(err) return callback(err);

		var cssAsString = JSON.stringify(result.source);

		// for importing CSS
		var importUrlPrefix = getImportPrefix(this, query);

		var alreadyImported = {};
		var importJs = result.importItems.filter(function(imp) {
			if(!imp.mediaQuery) {
				if(alreadyImported[imp.url])
					return false;
				alreadyImported[imp.url] = true;
			}
			return true;
		}).map(function(imp) {
			if(!loaderUtils.isUrlRequest(imp.url)) {
				return "exports.push([module.id, " +
					JSON.stringify("@import url(" + imp.url + ");") + ", " +
					JSON.stringify(imp.mediaQuery) + "]);";
			} else {
				var importUrl = importUrlPrefix + imp.url;
				return "exports.i(require(" + loaderUtils.stringifyRequest(this, importUrl) + "), " + JSON.stringify(imp.mediaQuery) + ");";
			}
		}, this).join("\n");

		function importItemMatcher(item) {
			var match = result.importItemRegExp.exec(item);
			var idx = +match[1];
			var importItem = result.importItems[idx];
			var importUrl = importUrlPrefix + importItem.url;
			return "\" + require(" + loaderUtils.stringifyRequest(this, importUrl) + ").locals" +
				"[" + JSON.stringify(importItem.export) + "] + \"";
		}

		cssAsString = cssAsString.replace(result.importItemRegExpG, importItemMatcher.bind(this));

		// helper for ensuring valid CSS strings from requires
		var urlEscapeHelper = "";

		if(query.url !== false && result.urlItems.length > 0) {
			urlEscapeHelper = "var escape = require(" + loaderUtils.stringifyRequest(this, require.resolve("./url/escape.js")) + ");\n";

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
					return "\" + escape(require(" + loaderUtils.stringifyRequest(this, urlRequest) + ")) + \"" +
							url.substr(idx);
				}
				urlRequest = url;
				return "\" + escape(require(" + loaderUtils.stringifyRequest(this, urlRequest) + ")) + \"";
			}.bind(this));
		}

		var exportJs = compileExports(result, importItemMatcher.bind(this), camelCaseKeys);
		if (exportJs) {
			exportJs = "exports.locals = " + exportJs + ";";
		}

		var moduleJs;
		if(sourceMap && result.map) {
			// add a SourceMap
			map = result.map;
			map = JSON.stringify(map);
			moduleJs = "exports.push([module.id, " + cssAsString + ", \"\", " + map + "]);";
		} else {
			moduleJs = "exports.push([module.id, " + cssAsString + ", \"\"]);";
		}

		// embed runtime
		callback(null, urlEscapeHelper +
			"exports = module.exports = require(" +
			loaderUtils.stringifyRequest(this, require.resolve("./css-base.js")) +
			")(" + sourceMap + ");\n" +
			"// imports\n" +
			importJs + "\n\n" +
			"// module\n" +
			moduleJs + "\n\n" +
			"// exports\n" +
			exportJs);
	}.bind(this));
};
