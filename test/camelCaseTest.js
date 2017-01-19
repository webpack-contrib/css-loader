/*globals describe */

var test = require("./helpers").test;
var cssBase = require("../lib/css-base");

describe("camelCase", function() {
	var css = ".btn-info_is-disabled { color: blue; }";
	var $css = {
		id: 1,
		content: "._1L-rnCOXCE_7H94L5XT4uB { color: blue; }", 
		imports: []
	};
	var exports = {
		with: {
			default: { 'btn-info_is-disabled':'_1L-rnCOXCE_7H94L5XT4uB' }, 
			export: { btnInfoIsDisabled: '_1L-rnCOXCE_7H94L5XT4uB' }
		},

		without: {
			default: {btnInfoIsDisabled: '_1L-rnCOXCE_7H94L5XT4uB', 'btn-info_is-disabled': '_1L-rnCOXCE_7H94L5XT4uB'},
			export: { btnInfoIsDisabled: '_1L-rnCOXCE_7H94L5XT4uB' }
		},

		dashes: {
			default: {btnInfo_isDisabled: '_1L-rnCOXCE_7H94L5XT4uB', 'btn-info_is-disabled': '_1L-rnCOXCE_7H94L5XT4uB'},
			export: { btnInfo_isDisabled: '_1L-rnCOXCE_7H94L5XT4uB' }
		}
	};

	exports.with.export.default = cssBase(exports.with.default, $css);
	exports.with.export.$css = $css;

	exports.without.export.default = cssBase(exports.without.default, $css);
	exports.without.export.$css = $css;

	exports.dashes.export.default = cssBase(exports.dashes.default, $css);
	exports.dashes.export.$css = $css;

	test("with", css, exports.with.export, "?modules");
	test("without", css, exports.without.export, "?modules&camelCase");
	test("dashes", css, exports.dashes.export, "?modules&camelCase=dashes");
});
