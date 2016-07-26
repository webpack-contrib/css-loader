/*globals describe */

var test = require("./helpers").test;

describe("camelCase", function() {
	var css = ".btn-info_is-disabled { color: blue; }";
	var exports = {
		with: [
			[1, "._3HmXvRDfbLlPvWusOyDJM8 { color: blue; }", ""]
		],
		without: [
			[1, "._3HmXvRDfbLlPvWusOyDJM8 { color: blue; }", ""]
		],
		dashes: [
			[1, "._3HmXvRDfbLlPvWusOyDJM8 { color: blue; }", ""]
		]
	};
	exports.with.locals = {'btn-info_is-disabled': '_3HmXvRDfbLlPvWusOyDJM8'};
	exports.without.locals = {btnInfoIsDisabled: '_3HmXvRDfbLlPvWusOyDJM8', 'btn-info_is-disabled': '_3HmXvRDfbLlPvWusOyDJM8'};
	exports.dashes.locals = {btnInfo_isDisabled: '_3HmXvRDfbLlPvWusOyDJM8', 'btn-info_is-disabled': '_3HmXvRDfbLlPvWusOyDJM8'};
	test("with", css, exports.with, "?modules");
	test("without", css, exports.without, "?modules&camelCase");
	test("dashes", css, exports.dashes, "?modules&camelCase=dashes");
});
