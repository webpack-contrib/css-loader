/*globals describe */

var test = require("./helpers").test;

describe("camelCase", function() {
	var css = ".btn-info { color: blue; }";
	var exports = {
		with: [
			[1, "._38r5hlPyrqKLodJwWOdM1k { color: blue; }", ""]
		],
		without: [
			[1, "._38r5hlPyrqKLodJwWOdM1k { color: blue; }", ""]
		]
	};
	exports.with.locals = {'btn-info': '_38r5hlPyrqKLodJwWOdM1k'};
	exports.without.locals = {btnInfo: '_38r5hlPyrqKLodJwWOdM1k'};
	test("with", css, exports.with, "?modules");
	test("without", css, exports.without, "?modules&camelCase");
});
