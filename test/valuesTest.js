/*globals describe */

var testLocals = require("./helpers").testLocals;
var test = require("./helpers").test;

function testLocal(name, input, result, localsResult, query, modules) {
	result.locals = localsResult;
	test(name, input, result, query, modules);
}

describe("values", function() {
	testLocals("should export values",
		"@value def: red; @value ghi: 1px solid black",
		{
			def: "red",
			ghi: "1px solid black"
		},
		""
	);
	testLocals("should export values and locals",
		"@value def: red; .ghi { color: def; }",
		{
			def: "red",
			ghi: "_ghi"
		},
		"?modules&localIdentName=_[local]"
	);
	testLocal("should import values from other module",
		"@value def from './file'; .ghi { color: def; }", [
			[ 2, "", "" ],
			[ 1, ".ghi { color: red; }", "" ]
		], {
			def: "red"
		}, "", {
			"./file": (function() {
				var a =  [[2, "", ""]];
				a.locals = {
					def: "red"
				};
				return a;
			})()
		}
	);
	testLocal("should import values with renaming",
		"@value def as aaa from './file1'; @value def as bbb from './file2'; .ghi { background: aaa, bbb, def; }", [
			[ 2, "", "" ],
			[ 3, "", "" ],
			[ 1, ".ghi { background: red, green, def; }", "" ]
		], {
			aaa: "red",
			bbb: "green"
		}, "", {
			"./file1": (function() {
				var a =  [[2, "", ""]];
				a.locals = {
					def: "red"
				};
				return a;
			})(),
			"./file2": (function() {
				var a =  [[3, "", ""]];
				a.locals = {
					def: "green"
				};
				return a;
			})()
		}
	);
});
