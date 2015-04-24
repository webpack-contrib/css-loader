/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var loaderUtils = require("loader-utils");
module.exports = function getPlaceholderIdent(loaderContext, placeholderName) {
	var hash = require("crypto").createHash("md5");
	hash.update(loaderContext.options && typeof loaderContext.options.context === "string" ?
		loaderUtils.stringifyRequest({ context: loaderContext.options.context }, loaderContext.request) :
		loaderContext.request);
	hash.update(placeholderName);
	return "z" + hash.digest("hex");
};
