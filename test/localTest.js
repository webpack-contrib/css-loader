/*globals describe */

var test = require("./helpers").test;
var testMinimize = require("./helpers").testMinimize;

function testLocal(name, input, result, localsResult, query, modules) {
	result.locals = localsResult;
	test(name, input, result, query, modules);
}

function testLocalMinimize(name, input, result, localsResult, query, modules) {
	result.locals = localsResult;
	testMinimize(name, input, result, query, modules);
}

describe("local", function() {
	testLocal("locals-format", ":local(.test) { background: red; }", [
		[1, ".test-2_pBx { background: red; }", ""]
	], {
		test: "test-2_pBx"
	}, "?localIdentName=[local]-[hash:base64:5]");
	testLocal("locals", ":local(.className) { background: red; }\n:local(#someId) { background: green; }\n" +
		":local(.className .subClass) { color: green; }\n:local(#someId .subClass) { color: blue; }", [
		[1, "._23J0282swY7bwvI2X4fHiV { background: red; }\n#_3vpqN0v_IxlO3TzQjbpB33 { background: green; }\n" +
			"._23J0282swY7bwvI2X4fHiV ._1s1VsToXFz17cPAltMg7jz { color: green; }\n#_3vpqN0v_IxlO3TzQjbpB33 ._1s1VsToXFz17cPAltMg7jz { color: blue; }", ""]
	], {
		className: "_23J0282swY7bwvI2X4fHiV",
		someId: "_3vpqN0v_IxlO3TzQjbpB33",
		subClass: "_1s1VsToXFz17cPAltMg7jz"
	});
	testLocalMinimize("minimized plus local", ":local(.localClass) { background: red; }\n:local .otherClass { background: red; }\n:local(.empty) { }", [
		[1, "._localClass,._otherClass{background:red}", ""]
	], {
		localClass: "_localClass",
		otherClass: "_otherClass",
		empty: "_empty"
	}, "?localIdentName=_[local]");
	testLocal("mode switching", ".c1 :local .c2 .c3 :global .c4 :local .c5, .c6 :local .c7 { background: red; }\n.c8 { background: red; }", [
		[1, ".c1 ._c2 ._c3 .c4 ._c5, .c6 ._c7 { background: red; }\n.c8 { background: red; }", ""]
	], {
		c2: "_c2",
		c3: "_c3",
		c5: "_c5",
		c7: "_c7"
	}, "?localIdentName=_[local]");
	testLocal("comment in local", ":local(.c1/*.c2*/.c3) { background: red; }", [
		[1, "._c1._c3 { background: red; }", ""]
	], {
		c1: "_c1",
		c3: "_c3"
	}, "?localIdentName=_[local]");
	testLocal("comment in local", ":local(.c1/*.c2*/.c3) { background: red; }", [
		[1, "._c1._c3 { background: red; }", ""]
	], {
		c1: "_c1",
		c3: "_c3"
	}, "?localIdentName=_[local]");
	testLocal("strings in local", ":local(.c1[data-attr=\".c2)]'\"]:not(.c3):not(.c4)) { background: red; }", [
		[1, "._c1[data-attr=\".c2)]'\"]:not(._c3):not(._c4) { background: red; }", ""]
	], {
		c1: "_c1",
		c3: "_c3",
		c4: "_c4"
	}, "?localIdentName=_[local]");

	testLocal("composes class simple", ":local(.c1) { a: 1; }\n:local(.c2) { composes: c1; b: 1; }", [
		[1, "._c1 { a: 1; }\n._c2 { b: 1; }", ""]
	], {
		c1: "_c1",
		c2: "_c2 _c1"
	}, "?localIdentName=_[local]");
	testLocal("composes class from module", [
		":local(.c1) { composes: c2 from \"./module\"; b: 1; }",
		":local(.c3) { composes: c1; b: 3; }",
		":local(.c5) { composes: c2 c4 from \"./module\"; b: 5; }"
	].join("\n"), [
		[2, ".test{c: d}", ""],
		[1, [
			"._c1 { b: 1; }",
			"._c3 { b: 3; }",
			"._c5 { b: 5; }"
		].join("\n"), ""]
	], {
		c1: "_c1 imported-c2",
		c3: "_c3 _c1 imported-c2",
		c5: "_c5 imported-c2 imported-c4"
	}, "?localIdentName=_[local]", {
		"./module": (function() {
			var r = [
				[2, ".test{c: d}", ""]
			];
			r.locals = {
				c2: "imported-c2",
				c4: "imported-c4"
			};
			return r;
		}())
	});
	testLocal("composes class with hyphen from module", [
		":local(.c1) { composes: c-2 from \"./module\"; b: 1; }",
		":local(.c3) { composes: c1; b: 3; }",
		":local(.c5) { composes: c-2 c4 from \"./module\"; b: 5; }"
	].join("\n"), [
		[2, ".test{c: d}", ""],
		[1, [
			"._c1 { b: 1; }",
			"._c3 { b: 3; }",
			"._c5 { b: 5; }"
		].join("\n"), ""]
	], {
		c1: "_c1 imported-c-2",
		c3: "_c3 _c1 imported-c-2",
		c5: "_c5 imported-c-2 imported-c4"
	}, "?localIdentName=_[local]", {
		"./module": (function() {
			var r = [
				[2, ".test{c: d}", ""]
			];
			r.locals = {
				"c-2": "imported-c-2",
				c4: "imported-c4"
			};
			return r;
		}())
	});
	testLocal("composes class from module with import", [
		"@import url(\"module\");",
		":local(.c1) { composes: c2 c3 from \"./module\"; composes: c4 from \"./module\"; b: 1; }"
	].join("\n"), [
		[2, ".test{c: d}", ""],
		[1, "._c1 { b: 1; }", ""]
	], {
		c1: "_c1 imported-c2 imported-c3 imported-c4"
	}, "?localIdentName=_[local]", {
		"./module": (function() {
			var r = [
				[2, ".test{c: d}", ""]
			];
			r.locals = {
				c2: "imported-c2",
				c3: "imported-c3",
				c4: "imported-c4"
			};
			return r;
		}())
	});
	testLocal("module mode", ".className { background: url(./file.png); }\n#someId { background: url('module/file.jpg'); }\n" +
		".className .subClass { font-size: 5.5pt; }\n#someId .subClass { color: blue; }", [
		[1, "._23J0282swY7bwvI2X4fHiV { background: url({./file.png}); }\n#_3vpqN0v_IxlO3TzQjbpB33 { background: url({module/file.jpg}); }\n" +
			"._23J0282swY7bwvI2X4fHiV ._1s1VsToXFz17cPAltMg7jz { font-size: 5.5pt; }\n#_3vpqN0v_IxlO3TzQjbpB33 ._1s1VsToXFz17cPAltMg7jz { color: blue; }", ""]
	], {
		className: "_23J0282swY7bwvI2X4fHiV",
		someId: "_3vpqN0v_IxlO3TzQjbpB33",
		subClass: "_1s1VsToXFz17cPAltMg7jz"
	}, "?module");
	testLocal("class name parsing", ".-a0-34a___f { color: red; }", [
		[1, "._3ZMCqVa1XidxdqbX65hZ5D { color: red; }", ""]
	], {
		"-a0-34a___f": "_3ZMCqVa1XidxdqbX65hZ5D"
	}, "?module");
	testLocal("imported values in decl", ".className { color: IMPORTED_NAME; }\n" +
		":import(\"./vars.css\") { IMPORTED_NAME: primary-color; }", [
		[1, "._className { color: red; }", ""]
	], {
		"className": "_className"
	}, "?module&localIdentName=_[local]", {
		"./vars.css": {
			locals: {
				"primary-color": "red"
			}
		}
	});
	testLocal("issue-109", ".bar-1 { color: red; }", [
		[1, ".file--bar-1--2JvfJ { color: red; }", ""]
	], {
		"bar-1": "file--bar-1--2JvfJ"
	}, "?modules&importLoaders=1&localIdentName=[name]--[local]--[hash:base64:5]");
	testLocal("path naming", ".bar { color: red; }", [
		[1, ".path-to--file--bar { color: red; }", ""]
	], {
		"bar": "path-to--file--bar"
	}, {
		query: "?modules&localIdentName=[path]-[name]--[local]",
		resourcePath: "/root/path/to/file.css",
		options: {
			context: "/root/"
		}
	});
	testLocal("path naming with context", ".bar { color: red; }", [
		[1, ".to--file--bar { color: red; }", ""]
	], {
		"bar": "to--file--bar"
	}, {
		query: "?modules&localIdentName=[path]-[name]--[local]&context=/root/path",
		resourcePath: "/root/path/to/file.css",
		options: {
			context: "/root/"
		}
	});
	testLocal("hash prefix", ".bar { color: red; }", [
		[1, ".bar--58a3b08b9195a6af0de7431eaf3427c7 { color: red; }", ""]
	], {
		"bar": "bar--58a3b08b9195a6af0de7431eaf3427c7"
	}, "?modules&localIdentName=[local]--[hash]&hashPrefix=x");
	testLocal("prefixes leading digit with underscore", ":local(.test) { background: red; }", [
		[1, "._1test { background: red; }", ""]
	], {
		test: "_1test"
	}, "?localIdentName=1[local]");
	testLocal("prefixes leading hyphen + digit with underscore", ":local(.test) { background: red; }", [
		[1, "._-1test { background: red; }", ""]
	], {
		test: "_-1test"
	}, "?localIdentName=-1[local]");
	testLocal("prefixes two leading hyphens with underscore", ":local(.test) { background: red; }", [
		[1, "._--test { background: red; }", ""]
	], {
		test: "_--test"
	}, "?localIdentName=--[local]");
	testLocal("saves underscore prefix in exported class names", ":export { _test: _test }", [
		[1, "", ""]
	], {
		_test: '_test'
	}, "?localIdentName=[local]");
});
