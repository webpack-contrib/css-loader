/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var loaderUtils = require("loader-utils");
module.exports = function(locals, localExtends, importedUrls, importUrlPrefix, result, importAccess) {
	var localKeys = Object.keys(locals);
	if(localKeys.length > 0) {
		var localLines = localKeys.map(function(key, idx) {
			var line = "  " + JSON.stringify(key) + ": ";
			function addExtend(extend) {
				if(extend.from) {
					var importUrl = importUrlPrefix +
						(extend.fromType === "url" ? loaderUtils.urlToRequest(extend.from) : extend.from);
					if(importedUrls && result && importedUrls.indexOf(importUrl) < 0) {
						result.push("exports.i(require(" + loaderUtils.stringifyRequest(this, importUrl) + "), \"\");");
						importedUrls.push(importUrl);
					}
					line += " + \" \" + require(" + loaderUtils.stringifyRequest(this, importUrl) + ")" + importAccess + "[" + JSON.stringify(extend.name) + "]";
				} else if(locals[extend.name]) {
					line += " + \" \" + " + JSON.stringify(locals[extend.name]);
					if(localExtends[extend.name]) {
						localExtends[extend.name].forEach(addExtend, this);
					}
				} else if(this.emitError) {
					this.emitError("Cannot extend from unknown class '" + extend.name + "'");
				}
			}
			line += JSON.stringify(locals[key]);
			if(localExtends[key]) {
				localExtends[key].forEach(addExtend, this);
			}
			if(idx !== localKeys.length - 1) line += ",";
			return line;
		}, this);
		return "{\n" + localLines.join("\n") + "\n}";
	}
};
