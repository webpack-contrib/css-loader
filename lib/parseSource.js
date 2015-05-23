/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var loaderUtils = require("loader-utils");
var Parser = require("fastparse");

function errorMatch(message, newParserMode) {
	return function(match) {
		var index = arguments[arguments.length - 1];
		var nextLine = this.source.indexOf("\n", index);
		var splittedSource = this.source.substr(0, index).split("\n");
		var line = splittedSource.length;
		var lineBeforeError = splittedSource.pop();
		var lineAfterError = this.source.substr(index, nextLine);
		this.errors.push("Unexpected '" + match + "' in line " + (line + 1) + ", " + message + "\n" +
			lineBeforeError + lineAfterError + "\n" + lineBeforeError.replace(/[^\\s]/g, " ") + "^");
		return newParserMode;
	};
}

function urlMatch(match, textBeforeUrl, replacedText, url, index) {
	this.urls.push({
		url: url,
		raw: replacedText,
		start: index + textBeforeUrl.length,
		length: replacedText.length
	});
}

function importMatch(match, url, mediaQuery, index) {
	this.imports.push({
		url: url,
		mediaQuery: mediaQuery,
		start: index,
		length: match.length
	});
}

function rulesStartMatch() {
	this.mode = null;
	return "firstRules";
}

function rulesEndMatch() {
	this.activeSelectors = [];
	return "source";
}

function nextSelectorMatch() {
	this.mode = null;
}

function enableLocal(match, whitespace, index) {
	this.remove.push({
		start: index + whitespace.length,
		length: match.length - whitespace.length
	});
	this.mode = "local";
}

function enableGlobal(match, whitespace, index) {
	this.remove.push({
		start: index + whitespace.length,
		length: match.length - whitespace.length
	});
	this.mode = "global";
}

function localStart(match, whitespace, index) {
	this.remove.push({
		start: index + whitespace.length,
		length: match.length - whitespace.length
	});
	this.bracketStatus = 0;
	return "local";
}

function globalStart(match, whitespace, index) {
	this.remove.push({
		start: index + whitespace.length,
		length: match.length - whitespace.length
	});
	this.bracketStatus = 0;
	return "global";
}

function withMode(mode, fn) {
	return function() {
		var oldMode = this.mode;
		this.mode = mode;
		var newParserMode = fn.apply(this, arguments);
		this.mode = oldMode;
		return newParserMode;
	};
}

function innerBracketIn() {
	this.bracketStatus++;
}

function innerBracketOut(match, index) {
	if(this.bracketStatus-- === 0) {
		this.remove.push({
			start: index,
			length: match.length
		});
		return "source";
	}
}

function selectorMatch(match, prefix, name, index) {
	var selector = {
		name: name,
		prefix: prefix,
		start: index,
		length: match.length,
		mode: this.mode
	};
	this.selectors.push(selector);
	this.activeSelectors.push(selector);
}

function extendsStartMatch(match, index) {
	this.remove.push({
		start: index,
		length: 0
	});
	this.activeExtends = [];
	return "extends";
}

function extendsEndMatch(match, index) {
	var lastRemove = this.remove[this.remove.length - 1];
	lastRemove.length = index + match.length - lastRemove.start;
	if(this.activeExtends.length === 0) {
		errorMatch("expected class names")(match, index);
		return "rules";
	}
	return "firstRules";
}

function extendsClassNameMatch(match, name, index) {
	this.activeSelectors.forEach(function(selector) {
		if(!selector.extends)
			selector.extends = [];
		var extend = {
			name: name,
			start: index,
			length: match.length,
			from: null,
			fromType: null
		};
		selector.extends.push(extend);
		this.activeExtends.push(extend);
	}, this);
}

function extendsFromUrlMatch(match, request) {
	this.activeExtends.forEach(function(extend) {
		extend.from = request;
		extend.fromType = "url";
	});
}

function extendsFromMatch(match, request) {
	this.activeExtends.forEach(function(extend) {
		extend.from = loaderUtils.parseString(request);
		extend.fromType = "module";
	});
}

var parser = new Parser({
	source: {
		// comment
		"/\\*.*?\\*/": true,

		// strings
		'"([^\\\\"]|\\\\.)*"': true,
		"'([^\\\\']|\\\\.)*'": true,

		// imports
		'@\\s*import\\s+"([^"]*)"\\s*([^;\\n]*);': importMatch,
		"@\\s*import\\s+'([^'']*)'\\s*([^;\\n]*);": importMatch,
		'@\\s*import\\s+url\\s*\\(\\s*"([^"]*)"\\s*\\)\\s*([^;\\n]*);': importMatch,
		"@\\s*import\\s+url\\s*\\(\\s*'([^']*)'\\s*\\)\\s*([^;\\n]*);": importMatch,
		"@\\s*import\\s+url\\s*\\(\\s*([^)]*)\\s*\\)\\s*([^;\\n]*);": importMatch,

		// atrule
		"@": "atrule",

		// inside
		"\\{": rulesStartMatch,

		// url
		'(url\\s*\\()(\\s*"([^"]*)"\\s*)\\)': urlMatch,
		"(url\\s*\\()(\\s*'([^']*)'\\s*)\\)": urlMatch,
		"(url\\s*\\()(\\s*([^)]*)\\s*)\\)": urlMatch,

		// local
		"(\\s*):local\\(": localStart,
		"():local": enableLocal,
		"(\\s+):local\\s*": enableLocal,

		// global
		"(\\s*):global\\(": globalStart,
		"():global": enableGlobal,
		"(\\s+):global\\s*": enableGlobal,

		// class
		"(\\.)([A-Za-z_\\-0-9]+)": selectorMatch,

		// id
		"(#)([A-Za-z_\\-0-9]+)": selectorMatch,

		",": nextSelectorMatch
	},
	atrule: {
		// comment
		"/\\*.*?\\*/": true,

		// strings
		'"([^\\\\"]|\\\\.)*"': true,
		"'([^\\\\']|\\\\.)*'": true,

		// back to normal source
		"\\{": "source"
	},
	firstRules: {
		// comment
		"/\\*.*?\\*/": true,

		"extends\\s*:": extendsStartMatch,

		"\\s+": true,

		// url
		".": "rules",

		// back to normal source
		"\\}": rulesEndMatch
	},
	rules: {
		// comment
		"/\\*.*?\\*/": true,

		// strings
		'"([^\\\\"]|\\\\.)*"': true,
		"'([^\\\\']|\\\\.)*'": true,

		// url
		'(url\\s*\\()(\\s*"([^"]*)"\\s*)\\)': urlMatch,
		"(url\\s*\\()(\\s*'([^']*)'\\s*)\\)": urlMatch,
		"(url\\s*\\()(\\s*([^)]*)\\s*)\\)": urlMatch,

		// back to normal source
		"\\}": rulesEndMatch
	},
	extends: {
		// comment
		"/\\*.*?\\*/": true,

		";\\s*": extendsEndMatch,

		// whitespace
		"\\s+": true,

		// from
		"from": "extendsFrom",

		// class name
		"([A-Za-z_\\-0-9]+)": extendsClassNameMatch,

		".": errorMatch("expected class names or 'from'", "rules")
	},
	extendsFrom: {
		// comment
		"/\\*.*?\\*/": true,

		";\\s*": extendsEndMatch,

		// whitespace
		"\\s+": true,

		// module
		'url\\s*\\(\\s*"([^"]*)"\\s*\\)': extendsFromUrlMatch,
		"url\\s*\\(\\s*'([^']*)'\\s*\\)": extendsFromUrlMatch,
		"url\\s*\\(\\s*([^)]*)\\s*\\)": extendsFromUrlMatch,
		'("(?:[^\\\\"]|\\\\.)*")': extendsFromMatch,
		"('(?:[^\\\\']|\\\\.)*')": extendsFromMatch,

		".": errorMatch("expected module identifier (a string or 'url(...)'')", "rules")
	},
	local: {
		// comment
		"/\\*.*?\\*/": true,

		// strings
		'"([^\\\\"]|\\\\.)*"': true,
		"'([^\\\\']|\\\\.)*'": true,

		// class
		"(\\.)([A-Za-z_\\-0-9]+)": withMode("local", selectorMatch),

		// id
		"(#)([A-Za-z_\\-0-9]+)": withMode("local", selectorMatch),

		// brackets
		"\\(": innerBracketIn,
		"\\)": innerBracketOut
	},
	global: {
		// comment
		"/\\*.*?\\*/": true,

		// strings
		'"([^\\\\"]|\\\\.)*"': true,
		"'([^\\\\']|\\\\.)*'": true,

		// class
		"(\\.)([A-Za-z_\\-0-9]+)": withMode("global", selectorMatch),

		// id
		"(#)([A-Za-z_\\-0-9]+)": withMode("global", selectorMatch),

		// brackets
		"\\(": innerBracketIn,
		"\\)": innerBracketOut
	}
});

module.exports = function parseSource(source) {
	var context = {
		source: source,
		imports: [],
		urls: [],
		selectors: [],
		remove: [],
		errors: [],
		activeSelectors: [],
		bracketStatus: 0,
		mode: null
	};
	return parser.parse("source", source, context);
};
