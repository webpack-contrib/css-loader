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

function placeholderMatch(match, name, index) {
	this.placeholders.push({
		name: name,
		start: index,
		length: match.length
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

var parser = new Parser({
	source: {
		"/\\*": "comment",

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

		// placeholder
		"{{([A-Za-z_0-9]+)}}": placeholderMatch
	},
	comment: {
		"\\*/": "source"
	}
});

module.exports = function parseSource(source) {
	var context = {
		imports: [],
		urls: [],
		placeholders: []
	};
	return parser.parse("source", source, context);
}
