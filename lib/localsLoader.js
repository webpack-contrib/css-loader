/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var loaderUtils = require("loader-utils");
var parseSource = require("./parseSource");

module.exports = function(content) {
	if(this.cacheable) this.cacheable();
	var query = loaderUtils.parseQuery(this.query);
	var importLoaders = parseInt(query.importLoaders, 10) || 0;

	// for importing CSS
	var loadersRequest = this.loaders.slice(
		this.loaderIndex,
		this.loaderIndex + 1 + importLoaders
	).map(function(x) { return x.request; }).join("!");
	var importUrlPrefix = "-!" + loadersRequest + "!";

	var stuff = parseSource(content);

	var locals = {};
	var localExtends = {};
	require("./processLocals").call(this, stuff.selectors, query, null, locals, localExtends);


	// generate the locals
	var localsData = require("./generateLocals").call(this, locals, localExtends, null, importUrlPrefix, null, "");


	return "module.exports = " + localsData + ";";
};
