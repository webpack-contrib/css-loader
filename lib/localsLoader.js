/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var loaderUtils = require("loader-utils");
var parseSource = require("./parseSource");
var getLocalIdent = require("./getLocalIdent");

module.exports = function(content) {
	if(this.cacheable) this.cacheable();
	var query = loaderUtils.parseQuery(this.query);
	var localIdentName = query.localIdentName || "[hash:base64]";
	var localIdentRegExp = query.localIdentRegExp;

	var stuff = parseSource(content);

	var locals = {};
	stuff.locals.forEach(function(local) {
		if(!locals[local.name]) {
			locals[local.name] = getLocalIdent(this, localIdentName, local.name, {
				regExp: localIdentRegExp
			});
		}
	}, this);

	return "module.exports = " + JSON.stringify(locals) + ";";
};
