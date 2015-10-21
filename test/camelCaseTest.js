/*globals describe */

var test = require("./helpers").test;

describe("camelCase", function() {
	var css = ".btn-info { color: blue; }";
	var exports = {
		with: [
			[1, ".Vh87YsUQA8A0EbntSqs6 { color: blue; }", ""]
		],
		without: [
			[1, ".Vh87YsUQA8A0EbntSqs6 { color: blue; }", ""]
		]
	};
	exports.with.locals = {'btn-info': 'Vh87YsUQA8A0EbntSqs6'};
	exports.without.locals = {btnInfo: 'Vh87YsUQA8A0EbntSqs6', 'btn-info': 'Vh87YsUQA8A0EbntSqs6'};
	test("with", css, exports.with, "?modules");
	test("without", css, exports.without, "?modules&camelCase");
});
