/*globals describe */

var test = require("./helpers").test;

describe("camelCase", function() {
	var css = ".btn-info_is-disabled { color: blue; }";
	var exports = {
		with: [
			[1, "._1L-rnCOXCE_7H94L5XT4uB { color: blue; }", ""]
		],
		without: [
			[1, "._1L-rnCOXCE_7H94L5XT4uB { color: blue; }", ""]
		],
		dashes: [
			[1, "._1L-rnCOXCE_7H94L5XT4uB { color: blue; }", ""]
		]
	};
	exports.with.locals = {'btn-info_is-disabled': '_1L-rnCOXCE_7H94L5XT4uB'};
	exports.without.locals = {btnInfoIsDisabled: '_1L-rnCOXCE_7H94L5XT4uB', 'btn-info_is-disabled': '_1L-rnCOXCE_7H94L5XT4uB'};
	exports.dashes.locals = {btnInfo_isDisabled: '_1L-rnCOXCE_7H94L5XT4uB', 'btn-info_is-disabled': '_1L-rnCOXCE_7H94L5XT4uB'};
	test("with", css, exports.with, "?modules");
	test("without", css, exports.without, "?modules&camelCase");
	test("dashes", css, exports.dashes, "?modules&camelCase=dashes");
});
