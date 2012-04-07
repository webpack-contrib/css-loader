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
		result.push("require(" + JSON.stringify(__filename) + " + \"!\" + " + JSON.stringify(imp.url) + ")");
	});
	
	result.push(JSON.stringify(csso.translate(tree)));
	console.dir(result);
	return "module.exports =\n\t" + result.join(" +\n\t") + ";";
}

function extractImports(tree) {
	console.dir(tree);
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
					imp.media.push(item[1]);
				}
			}
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