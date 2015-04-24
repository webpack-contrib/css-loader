/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var parseSource = require("./parseSource");
var getPlaceholderIdent = require("./getPlaceholderIdent");

module.exports = function(content) {
	if(this.cacheable) this.cacheable();

	var stuff = parseSource(content);

	var placeholders = {};
	stuff.placeholders.forEach(function(placeholder) {
		if(!placeholders[placeholder.name]) {
			placeholders[placeholder.name] = getPlaceholderIdent(this, placeholder.name);
		}
	}, this);

	return "module.exports = " + JSON.stringify(placeholders) + ";";
};
