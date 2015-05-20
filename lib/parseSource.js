/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var Parser = require("fastparse");

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

function oldLocalMatch(match, prefix, name, index) {
	this.locals.push({
		name: name,
		prefix: prefix,
		start: index,
		deprecated: true,
		length: match.length
	});
}

function localStart(match, index) {
	this.remove.push({
		start: index,
		length: match.length
	});
	this.bracketStatus = 0;
	return "local";
}

function localBracketIn() {
	this.bracketStatus++;
}

function localBracketOut(match, index) {
	if(this.bracketStatus-- === 0) {
		this.remove.push({
			start: index,
			length: match.length
		});
		return "source";
	}
}

function localMatch(match, prefix, name, index) {
	this.locals.push({
		name: name,
		prefix: prefix,
		start: index,
		length: match.length
	});
}

function extendsStart(match, index) {
	this.remove.push({
		start: index,
		length: 0
	});
	return "extends";
}

function extendsEnd(match, index) {
	var lastRemove = this.remove[this.remove.length - 1];
	lastRemove.length = index + match.length - lastRemove.start;
	return "source";
}

function extendsMatch(match, prefix, name, index) {
	var lastLocal = this.locals[this.locals.length - 1];
	if(!lastLocal) {
		this.errors.push("No :local before :extends");
		return;
	}
	if(!lastLocal.extends)
		lastLocal.extends = [];
	lastLocal.extends.push({
		name: name,
		prefix: prefix,
		start: index,
		length: match.length
	});
}

function fromMatch(match, importedString) {
	var lastLocal = this.locals[this.locals.length - 1];
	if(!lastLocal) {
		this.errors.push("No :local before :extends");
		return;
	}
	if(!lastLocal.extends) {
		this.errors.push("No class before 'from'");
		return;
	}
	for(var i = lastLocal.extends.length - 1; i >= 0; i--) {
		var extend = lastLocal.extends[i];
		if(extend.from) return;
		extend.from = JSON.parse(importedString);
	}
}

var parser = new Parser({
	source: {
		"/\\*": "comment",

		// strings
		'"([^\\\\"]|\\\\.)*"': true,
		"'([^\\\\']|\\\\.)*'": true,

		// imports
		'@\\s*import\\s+"([^"]*)"\\s*([^;\\n]*);': importMatch,
		"@\\s*import\\s+'([^'']*)'\\s*([^;\\n]*);": importMatch,
		'@\\s*import\\s+url\\s*\\(\\s*"([^"]*)"\\s*\\)\\s*([^;\\n]*);': importMatch,
		"@\\s*import\\s+url\\s*\\(\\s*'([^']*)'\\s*\\)\\s*([^;\\n]*);": importMatch,
		"@\\s*import\\s+url\\s*\\(\\s*([^)]*)\\s*\\)\\s*([^;\\n]*);": importMatch,

		// url
		'(url\\s*\\()(\\s*"([^"]*)"\\s*)\\)': urlMatch,
		"(url\\s*\\()(\\s*'([^']*)'\\s*)\\)": urlMatch,
		"(url\\s*\\()(\\s*([^)]*)\\s*)\\)": urlMatch,

		// local
		":local\\(": localStart,
		"(\\.)local\\[([A-Za-z_0-9]+)\\]": oldLocalMatch,
		"(#)local\\[([A-Za-z_0-9]+)\\]": oldLocalMatch,

		// extend
		":extends\\(": extendsStart
	},
	comment: {
		"\\*/": "source"
	},
	local: {
		"/\\*": "localComment",

		// strings
		'"([^\\\\"]|\\\\.)*"': true,
		"'([^\\\\']|\\\\.)*'": true,

		// class
		"(\\.)([A-Za-z_0-9]+)": localMatch,

		// id
		"(#)([A-Za-z_0-9]+)": localMatch,

		// brackets
		"\\(": localBracketIn,
		"\\)": localBracketOut
	},
	localComment: {
		"\\*/": "local"
	},
	extends: {
		"/\\*": "extendsComment",

		// class
		"(\\.)([A-Za-z_0-9]+)": extendsMatch,

		// import
		"from\\s+(\"(?:[^\\\\\"]|\\\\.)*\")": fromMatch,

		"\\s": true,

		"\\)": extendsEnd,

		"[^)]+": function(match, index) {
			this.errors.push(
				"Unexpected syntax in " +
				this.source.substring(this.remove[this.remove.length - 1].start, index) +
				"|" +
				this.source.substring(index, index + match.length
			));
		}
	},
	extendsComment: {
		"\\*/": "extends"
	}
});

module.exports = function parseSource(source) {
	var context = {
		source: source,
		imports: [],
		urls: [],
		locals: [],
		remove: [],
		errors: [],
		bracketStatus: 0
	};
	return parser.parse("source", source, context);
};
