/*globals describe */

var test = require("./helpers").test;
var testRaw = require("./helpers").testRaw;

describe("camelCase", function() {
	var css = ".btn-info_is-disabled { color: blue; }";
	var exports = {
		with: [
			[1, ".test-css-file--btn-info_is-disabled { color: blue; }", ""]
		],
		without: [
			[1, ".test-css-file--btn-info_is-disabled { color: blue; }", ""]
		],
		dashes: [
			[1, ".test-css-file--btn-info_is-disabled { color: blue; }", ""]
		]
	};
	exports.with.locals = {'btn-info_is-disabled': 'test-css-file--btn-info_is-disabled'};
	exports.without.locals = {btnInfoIsDisabled: 'test-css-file--btn-info_is-disabled', 'btn-info_is-disabled': 'test-css-file--btn-info_is-disabled'};
	exports.dashes.locals = {btnInfo_isDisabled: 'test-css-file--btn-info_is-disabled', 'btn-info_is-disabled': 'test-css-file--btn-info_is-disabled'};
	test("with", css, exports.with, "?modules");
	test("without", css, exports.without, "?modules&camelCase");
	test("dashes", css, exports.dashes, "?modules&camelCase=dashes");

	testRaw("withoutRaw", '.a {}', 'exports.locals = {\n\t"a": "_1buUQJccBRS2-2i27LCoDf"\n};', "?modules&camelCase");
	testRaw("dashesRaw", '.a {}', 'exports.locals = {\n\t"a": "_1buUQJccBRS2-2i27LCoDf"\n};', "?modules&camelCase=dashes");
});
