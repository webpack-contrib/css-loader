/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var getLocalIdent = require("./getLocalIdent");
module.exports = function(parsedLocals, query, replacer, locals, localExtends) {
	var localIdentName = query.localIdentName || "[hash:base64]";
	var localIdentRegExp = query.localIdentRegExp;

	parsedLocals.forEach(function(local) {
		var ident;
		var name = local.name;
		if(!locals[name]) {
			ident = getLocalIdent(this, localIdentName, name, {
				regExp: localIdentRegExp
			});
			locals[name] = ident;
		} else {
			ident = locals[name];
		}
		if(local.extends) {
			local.extends.forEach(function(extend) {
				if(!localExtends[name])
					localExtends[name] = [];
				localExtends[name].push(extend);
			});
		}
		if(replacer)
			replacer.replace(local.start, local.length, local.prefix + ident);
	}, this);
};
