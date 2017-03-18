/*globals describe */

var test = require("./helpers").test;

describe("alias", function() {
	var css = ".className { background: url(./path/to/file.png); }";
	var exports = {
		without: [
			[1, ".className { background: url({./path/to/file.png}); }", ""]
		],
		onlyModule: [
			[1, ".className { background: url({module/file.png}); }", ""]
		],
		exactMatch: [
			[1, ".className { background: url({module/file.png}); }", ""]
		],
		notExactMatch: [
			[1, ".className { background: url({./path/to/file.png}); }", ""]
		]
	};

	function aliasOptions(alias) {
		return { query: { alias: alias }}
	}

	test("without", css, exports.without);
	test("onlyModule", css, exports.onlyModule, aliasOptions({ "./path/to": "module" }));
	test("exactMatch", css, exports.exactMatch, aliasOptions({ "./path/to/file.png$": "module/file.png" }));
	test("notExactMatch", css, exports.notExactMatch, aliasOptions({ "./path/to/file.jpg$": "module/file.jpg" }));
});
