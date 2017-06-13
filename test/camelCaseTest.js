/*globals describe */

var test = require("./helpers").test;
var testRaw = require("./helpers").testRaw;

describe("camelCase", function() {
	var css = ".btn-info_is-disabled { color: blue; }";
	var cssMultipleDashes = ".btn--info_is-disabled { color: blue; }";
	var mixedCss = ".btn-info_is-disabled { color: blue; } .simple { color: red; }";
	var exports = {
		with: [
			[1, "._1L-rnCOXCE_7H94L5XT4uB { color: blue; }", ""]
		],
		without: [
			[1, "._1L-rnCOXCE_7H94L5XT4uB { color: blue; }", ""]
		],
		dashes: [
			[1, "._1L-rnCOXCE_7H94L5XT4uB { color: blue; }", ""]
		],
		multipleDashes: [
			[1, "._3JUlsKrl__OF70Fq391jEw { color: blue; }", ""]
		],
		withoutOnly: [
			[1, "._1L-rnCOXCE_7H94L5XT4uB { color: blue; } .KKtodWG-IuEaequFjAsoJ { color: red; }", ""]
		],
		dashesOnly: [
			[1, "._1L-rnCOXCE_7H94L5XT4uB { color: blue; } .KKtodWG-IuEaequFjAsoJ { color: red; }", ""]
		]
	};
	exports.with.locals = {'btn-info_is-disabled': '_1L-rnCOXCE_7H94L5XT4uB'};
	exports.without.locals = {btnInfoIsDisabled: '_1L-rnCOXCE_7H94L5XT4uB', 'btn-info_is-disabled': '_1L-rnCOXCE_7H94L5XT4uB'};
	exports.dashes.locals = {btnInfo_isDisabled: '_1L-rnCOXCE_7H94L5XT4uB', 'btn-info_is-disabled': '_1L-rnCOXCE_7H94L5XT4uB'};
	exports.multipleDashes.locals = {btnInfo_isDisabled: '_3JUlsKrl__OF70Fq391jEw', 'btn--info_is-disabled': '_3JUlsKrl__OF70Fq391jEw'};
	exports.withoutOnly.locals = {btnInfoIsDisabled: '_1L-rnCOXCE_7H94L5XT4uB', simple: 'KKtodWG-IuEaequFjAsoJ'};
	exports.dashesOnly.locals = {btnInfo_isDisabled: '_1L-rnCOXCE_7H94L5XT4uB', simple: 'KKtodWG-IuEaequFjAsoJ'};
	test("with", css, exports.with, "?modules");
	test("without", css, exports.without, "?modules&camelCase");
	test("dashes", css, exports.dashes, "?modules&camelCase=dashes");
	test("multipleDashes", cssMultipleDashes, exports.multipleDashes, "?modules&camelCase=dashes");
	// Remove this option in v1.0.0 and make the removal of the original classname the default behaviour. See #440.
	test("withoutOnly", mixedCss, exports.withoutOnly, "?modules&camelCase=only");
	// Remove this option in v1.0.0 and make the removal of the original classname the default behaviour. See #440.
	test("dashesOnly", mixedCss, exports.dashesOnly, "?modules&camelCase=dashesOnly");

	testRaw("withoutRaw", '.a {}', 'exports.locals = {\n\t"a": "_1buUQJccBRS2-2i27LCoDf"\n};', "?modules&camelCase");
	testRaw("dashesRaw", '.a {}', 'exports.locals = {\n\t"a": "_1buUQJccBRS2-2i27LCoDf"\n};', "?modules&camelCase=dashes");
});
