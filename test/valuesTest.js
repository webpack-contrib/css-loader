/*globals describe */

var testLocals = require("./helpers").testLocals;
var test = require("./helpers").test;
var camelCase = require("../lib/camelCase");
var cssBase = require("../lib/css-base");

function testLocal(name, input, result, localsResult, query, modules) {
	Object.keys(localsResult).map(function(key) {
		var newKey = camelCase(key, query && query.camelCaseKeys ? query.camelCaseKeys : false);
		result[newKey] = localsResult[key];
	});
	result.default = cssBase(localsResult, input);
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
	var file = {
		$css: {
			id: 2,
			content: "",
			imports: []
		},
		def: "red",
		default: {
			def: "red"
		}
	};
	var module = {
		$css: {
			id: 1,
			content: ".ghi { color: red; }",
			imports: [
				[file.$css, undefined]
			]
		}
	};
	testLocal("should import values from other module",
		"@value def from './file'; .ghi { color: def; }", module, {
			def: "red"
		}, "", {
			"./file": file
		}
	);

	
	var file1 = {
		$css: {
			id: 2,
			content: "",
			imports: []
		},
		def: "red",
		default: {
			def: "red"
		}
	};
	var file2 = {
		$css: {
			id: 3,
			content: "",
			imports: []
		},
		def: "green",
		default: {
			def: "green"
		}
	};
	var module2 = {
		$css: {
			id: 1,
			content: ".ghi { background: red, green, def; }",
			imports: [
				[file1.$css, undefined],
				[file2.$css, undefined]
			]
		}
	};

	testLocal("should import values with renaming",
		"@value def as aaa from './file1'; @value def as bbb from './file2'; .ghi { background: aaa, bbb, def; }", module2, {
			aaa: "red",
			bbb: "green"
		}, "", {
			"./file1": file1,
			"./file2": file2
		}
	);
});
