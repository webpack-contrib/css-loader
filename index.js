/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var csso = require("csso");
var SourceNode = require("source-map").SourceNode;
var loaderUtils = require("loader-utils");
module.exports = function(content) {
	this.cacheable && this.cacheable();
	var result = [];
	var query = loaderUtils.parseQuery(this.query);
	var root = query.root;
	var tree = csso.parse(content, "stylesheet");
	if(tree && this && this.minimize) {
		tree = csso.compress(tree);
		tree = csso.cleanInfo(tree);
	}

	if(tree) {
		var imports = extractImports(tree);
		annotateUrls(tree);

		imports.forEach(function(imp) {
			if(!loaderUtils.isUrlRequest(imp.url)) {
				result.push(JSON.stringify("@import url(" + imp.url + ")" + imp.media.join("") + ";"));
			} else {
				if(imp.media.length > 0) {
					result.push(JSON.stringify("@media " + imp.media.join("") + "{"));
				}
				result.push("require(" + JSON.stringify("!" + __filename + "!" + loaderUtils.urlToRequest(imp.url)) + ")");
				if(imp.media.length > 0) {
					result.push(JSON.stringify("}"));
				}
			}
		});
	}

	var css = JSON.stringify(tree ? csso.translate(tree) : "");
	var uriRegExp = /%CSSURL\[%(.*?)%\]CSSURL%/g;
	css = css.replace(uriRegExp, function(str) {
		var match = /^%CSSURL\[%(.*?)%\]CSSURL%$/.exec(str);
		if(!loaderUtils.isUrlRequest(match[1], root)) return match[1];
		var idx = match[1].indexOf("?");
		if(idx < 0) idx = match[1].indexOf("#");
		if(idx > 0) {
			// in cases like url('webfont.eot?#iefix')
			var url = JSON.parse("\"" + match[1].substr(0, idx) + "\"");
			return "\"+require(" + JSON.stringify(loaderUtils.urlToRequest(url, root)) + ")+\"" + match[1].substr(idx);
		} else if(idx === 0) {
			// only hash
			return match[1];
		}
		var url = JSON.parse("\"" + match[1] + "\"");
		return "\"+require(" + JSON.stringify(loaderUtils.urlToRequest(url, root)) + ")+\"";
	});
	result.push(css);
	var cssRequest = loaderUtils.getRemainingRequest(this);
	var node = new SourceNode(1, 0,
		cssRequest,
		"module.exports =\n\t" + result.join(" +\n\t") + ";");
	var stringWithMap = node.toStringWithSourceMap({
		file: loaderUtils.getCurrentRequest(this)
	});
	stringWithMap.map.setSourceContent(cssRequest, content);
	this.callback(null, stringWithMap.code, stringWithMap.map.toJSON());
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
function annotateUrls(tree) {
	function iterateChildren() {
		for(var i = 1; i < tree.length; i++) {
			annotateUrls(tree[i]);
		}
	}
	switch(tree[0]) {
	case "stylesheet": return iterateChildren();
	case "ruleset": return iterateChildren();
	case "block": return iterateChildren();
	case "atruleb": return iterateChildren();
	case "atruler": return iterateChildren();
	case "atrulers": return iterateChildren();
	case "declaration": return iterateChildren();
	case "value": return iterateChildren();
	case "uri":
		for(var i = 1; i < tree.length; i++) {
			var item = tree[i];
			switch(item[0]) {
			case "ident":
			case "raw":
				item[1] = "%CSSURL[%" + item[1] + "%]CSSURL%";
				return;
			case "string":
				item[1] = "%CSSURL[%" + item[1].substring(1, item[1].length-1) + "%]CSSURL%";
				return;
			}
		}
	}
}

