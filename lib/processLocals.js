/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var getLocalIdent = require("./getLocalIdent");
module.exports = function(parsedLocals, query, replacer, locals, localExtends) {
	var localIdentName = query.localIdentName || "[hash:base64]";
	var localIdentRegExp = query.localIdentRegExp;
	var moduleMode = query.module;

	parsedLocals.forEach(function(selector) {
		if(moduleMode) {
			if(selector.mode === "global")
				return;
		} else {
			if(selector.mode !== "local")
				return;
		}
		var ident;
		var name = selector.name;
		if(!locals[name]) {
			ident = getLocalIdent(this, localIdentName, name, {
				regExp: localIdentRegExp
			});
			locals[name] = ident;
		} else {
			ident = locals[name];
		}
		if(selector.extends) {
			selector.extends.forEach(function(extend) {
				if(!localExtends[name])
					localExtends[name] = [];
				localExtends[name].push(extend);
			});
		}
		if(replacer)
			replacer.replace(selector.start, selector.length, selector.prefix + ident);
	}, this);
};
