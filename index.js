/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var csso = require("csso");
module.exports = function(content) {
	var options = this;
	var result = [];
	var tree = csso.parse(content, "stylesheet");
	if(options.minimize)
		tree = csso.compress(tree);
	tree = csso.cleanInfo(tree);
	
	var imports = extractImports(tree);
	
	imports.forEach(function(imp) {
		if(imp.media.length > 0) {
			result.push(JSON.stringify("@media " + imp.media.join("") + "{"));
		}
		result.push("require(" + JSON.stringify(__filename) + " + \"!\" + " + JSON.stringify(urlToRequire(imp.url)) + ")");
		if(imp.media.length > 0) {
			result.push(JSON.stringify("}"));
		}
	});
	
	result.push(JSON.stringify(csso.translate(tree)));
	return "module.exports =\n\t" + result.join(" +\n\t") + ";";
}

function urlToRequire(url) {
	if(/^~/.test(url))
		return url.substring(1);
	else
		return "./"+url;
}
function extractImports(tree) {
	var results = [];
	var removes = [];
	for(var i = 1; i < tree.length; i++) {
		var rule = tree[i];
		if(rule[0] === "atrules" &&
			rule[1][0] === "atkeyword" &&
			rule[1][1][0] === "ident" &&
			rule[1][1][1] === "import") {
			var imp = {
				url: null,
				media: []
			};
			for(var j = 2; j < rule.length; j++) {
				var item = rule[j];
				if(item[0] === "string") {
					imp.url = JSON.parse(item[1]);
				} else if(item[0] === "uri") {
					imp.url = item[1][0] === "string" ? JSON.parse(item[1][1]) : item[1][1];
				} else if(item[0] === "ident" && item[1] !== "url") {
					imp.media.push(csso.translate(item));
				} else if(item[0] !== "s" || imp.media.length > 0) {
					imp.media.push(csso.translate(item));
				}
			}
			while(imp.media.length > 0 &&
				/^\s*$/.test(imp.media[imp.media.length-1]))
				imp.media.pop();
			if(imp.url !== null) {
				results.push(imp);
				removes.push(i);
			}
		}
	}
	removes.reverse().forEach(function(i) {
		tree.splice(i, 1);
	});
	return results;
}