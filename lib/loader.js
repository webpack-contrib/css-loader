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
var getLocalIdent = require("./getLocalIdent");

module.exports = function(content, map) {
	if(this.cacheable) this.cacheable();
	var query = loaderUtils.parseQuery(this.query);
	var root = query.root;
	var forceMinimize = query.minimize;
	var importLoaders = parseInt(query.importLoaders, 10) || 0;
	var minimize = typeof forceMinimize !== "undefined" ? !!forceMinimize : (this && this.minimize);
	var localIdentName = query.localIdentName || "[hash:base64]";
	var localIdentRegExp = query.localIdentRegExp;

	if(typeof map !== "string") {
		map = JSON.stringify(map);
	}

	var result = [];

	var stuff = parseSource(content);

	var replacer = new ReplaceMany();
	stuff.imports.forEach(function(imp) {
		replacer.replace(imp.start, imp.length, "");
		if(!loaderUtils.isUrlRequest(imp.url, root)) {
			result.push("exports.push([module.id, " +
				JSON.stringify("@import url(" + imp.url + ");") + ", " +
				JSON.stringify(imp.mediaQuery) + "]);");
		} else {
			var loadersRequest = this.loaders.slice(
				this.loaderIndex,
				this.loaderIndex + 1 + importLoaders
			).map(function(x) { return x.request; }).join("!");
			var importUrl = "-!" +
				loadersRequest + "!" +
				loaderUtils.urlToRequest(imp.url);
			result.push("exports.i(require(" + loaderUtils.stringifyRequest(this, importUrl) + "), " + JSON.stringify(imp.mediaQuery) + ");");
		}
	}, this);
	stuff.urls.forEach(function(url, idx) {
		replacer.replace(url.start, url.length, "__CSSLOADERURL_" + idx + "__");
	});
	var locals = {};
	stuff.locals.forEach(function(local) {
		var ident;
		if(!locals[local.name]) {
			ident = getLocalIdent(this, localIdentName, local.name, {
				regExp: localIdentRegExp
			});
			locals[local.name] = ident;
		} else {
			ident = locals[local.name];
		}
		replacer.replace(local.start, local.length, local.prefix + ident);
	}, this);

	var cssContent = replacer.run(content);

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
		if(idx > 0) {
			// in cases like url('webfont.eot?#iefix')
			var urlRequest = url.substr(0, idx);
			return "\"+require(" + loaderUtils.stringifyRequest(this, loaderUtils.urlToRequest(urlRequest, root)) + ")+\"" + url.substr(idx);
		} else if(idx === 0) {
			// only hash
			return toEmbStr(urlItem.raw);
		}
		return "\"+require(" + loaderUtils.stringifyRequest(this, loaderUtils.urlToRequest(url, root)) + ")+\"";
	}.bind(this));

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

	if(Object.keys(locals).length > 0) {
		result.push("exports.locals = " + JSON.stringify(locals) + ";");
	}

	return "exports = module.exports = require(" + loaderUtils.stringifyRequest(this, require.resolve("./css-base.js")) + ")();\n" +
		result.join("\n");
};
