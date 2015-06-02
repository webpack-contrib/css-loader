/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var path = require("path");
var parseSource = require("./parseSource");
var ReplaceMany = require("./ReplaceMany");
var loaderUtils = require("loader-utils");
var SourceListMap = require("source-list-map").SourceListMap;
var CleanCSS = require("clean-css");

module.exports = function(content, map) {
	if(this.cacheable) this.cacheable();
	var query = loaderUtils.parseQuery(this.query);
	var root = query.root;
	var forceMinimize = query.minimize;
	var importLoaders = parseInt(query.importLoaders, 10) || 0;
	var minimize = typeof forceMinimize !== "undefined" ? !!forceMinimize : (this && this.minimize);
	var moduleMode = query.module;

	if(typeof map !== "string") {
		map = JSON.stringify(map);
	}

	var result = [];

	// for importing CSS
	var loadersRequest = this.loaders.slice(
		this.loaderIndex,
		this.loaderIndex + 1 + importLoaders
	).map(function(x) { return x.request; }).join("!");
	var importUrlPrefix = "-!" + loadersRequest + "!";

	var stuff = parseSource(content);

	var replacer = new ReplaceMany();

	// store already imported files
	var importedUrls = [];

	// add @imports to result
	stuff.imports.forEach(function(imp) {
		replacer.replace(imp.start, imp.length, "");
		if(!loaderUtils.isUrlRequest(imp.url, root)) {
			result.push("exports.push([module.id, " +
				JSON.stringify("@import url(" + imp.url + ");") + ", " +
				JSON.stringify(imp.mediaQuery) + "]);");
		} else {
			var importUrl = importUrlPrefix +
				(moduleMode ? imp.url : loaderUtils.urlToRequest(imp.url));
			result.push("exports.i(require(" + loaderUtils.stringifyRequest(this, importUrl) + "), " + JSON.stringify(imp.mediaQuery) + ");");
			if(!imp.mediaQuery)
				importedUrls.push(importUrl);
		}
	}, this);

	// replace url(...)
	if(query.url !== false) {
		stuff.urls.forEach(function(url, idx) {
			replacer.replace(url.start, url.length, "__CSSLOADERURL_" + idx + "__");
		});
	}

	// replace :local()
	var locals = {};
	var localExtends = {};
	require("./processLocals").call(this, stuff.selectors, query, replacer, locals, localExtends);

	// remove stuff
	stuff.remove.forEach(function(rem) {
		replacer.replace(rem.start, rem.length, "");
	});

	// pass errors from parser
	if(this.emitError) {
		stuff.errors.forEach(function(err) {
			this.emitError(err);
		}, this);
	}

	// generate the locals
	var localsData = require("./generateLocals").call(this, locals, localExtends, importedUrls, importUrlPrefix, result, ".locals");
	if(localsData) {
		result.push("exports.locals = " + localsData + ";");
	}

	// transform the CSS
	var cssContent = replacer.run(content);

	// minimize CSS
	if(minimize) {
		var options = Object.create(query);
		if(query.sourceMap && map) {
			options.sourceMap = map;
		}
		var minimizeResult = new CleanCSS(options).minify(cssContent);
		map = minimizeResult.sourceMap;
		cssContent = minimizeResult.styles;
		if(typeof map !== "string")
			map = JSON.stringify(map);
	}

	function toEmbStr(str) {
		return JSON.stringify(str).replace(/^"|"$/g, "");
	}

	// replace url(...) in the generated code
	var css = JSON.stringify(cssContent);
	var urlRegExp = /__CSSLOADERURL_[0-9]+__/g;
	css = css.replace(urlRegExp, function(str) {
		var match = /^__CSSLOADERURL_([0-9]+)__$/.exec(str);
		if(!match) return str;
		var idx = parseInt(match[1], 10);
		if(!stuff.urls[idx]) return str;
		var urlItem = stuff.urls[idx];
		var url = urlItem.url;
		if(!loaderUtils.isUrlRequest(url, root))
			return toEmbStr(urlItem.raw);
		idx = url.indexOf("?#");
		if(idx < 0) idx = url.indexOf("#");
		var urlRequest;
		if(idx > 0) { // idx === 0 is catched by isUrlRequest
			// in cases like url('webfont.eot?#iefix')
			urlRequest = url.substr(0, idx);
			if(!moduleMode) urlRequest = loaderUtils.urlToRequest(urlRequest, root);
			return "\"+require(" + loaderUtils.stringifyRequest(this, urlRequest) + ")+\"" + url.substr(idx);
		}
		urlRequest = url;
		if(!moduleMode) urlRequest = loaderUtils.urlToRequest(url, root);
		return "\"+require(" + loaderUtils.stringifyRequest(this, urlRequest) + ")+\"";
	}.bind(this));

	// add a SourceMap
	if(query.sourceMap && !minimize) {
		var cssRequest = loaderUtils.getRemainingRequest(this);
		var request = loaderUtils.getCurrentRequest(this);
		if(!map) {
			var sourceMap = new SourceListMap();
			sourceMap.add(content, cssRequest, content);
			map = sourceMap.toStringWithSourceMap({
				file: request
			}).map;
			if(map.sources) {
				map.sources = map.sources.map(function(source) {
					var p = path.relative(query.context || this.options.context, source).replace(/\\/g, "/");
					if(p.indexOf("../") !== 0)
						p = "./" + p;
					return "/" + p;
				}, this);
				map.sourceRoot = "webpack://";
			}
			map = JSON.stringify(map);
		}
		result.push("exports.push([module.id, " + css + ", \"\", " + map + "]);");
	} else {
		result.push("exports.push([module.id, " + css + ", \"\"]);");
	}

	// embed runtime
	return "exports = module.exports = require(" + loaderUtils.stringifyRequest(this, require.resolve("./css-base.js")) + ")();\n" +
		result.join("\n");
};
