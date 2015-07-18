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
		[1, ".test-3tNsp { background: red; }", ""]
	], {
		test: "test-3tNsp"
	}, "?localIdentName=[local]-[hash:base64:5]");
	testLocal("locals", ":local(.className) { background: red; }\n:local(#someId) { background: green; }\n" +
		":local(.className .subClass) { color: green; }\n:local(#someId .subClass) { color: blue; }", [
		[1, "._23_aKvs-b8bW2Vg3fwHozO { background: red; }\n#_1j3LM6lKkKzRIt19ImYVnD { background: green; }\n" +
			"._23_aKvs-b8bW2Vg3fwHozO ._13LGdX8RMStbBE9w-t0gZ1 { color: green; }\n#_1j3LM6lKkKzRIt19ImYVnD ._13LGdX8RMStbBE9w-t0gZ1 { color: blue; }", ""]
	], {
		className: "_23_aKvs-b8bW2Vg3fwHozO",
		someId: "_1j3LM6lKkKzRIt19ImYVnD",
		subClass: "_13LGdX8RMStbBE9w-t0gZ1"
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
		[1, "._23_aKvs-b8bW2Vg3fwHozO { background: url({./file.png}); }\n#_1j3LM6lKkKzRIt19ImYVnD { background: url({module/file.jpg}); }\n" +
			"._23_aKvs-b8bW2Vg3fwHozO ._13LGdX8RMStbBE9w-t0gZ1 { font-size: 5.5pt; }\n#_1j3LM6lKkKzRIt19ImYVnD ._13LGdX8RMStbBE9w-t0gZ1 { color: blue; }", ""]
	], {
		className: "_23_aKvs-b8bW2Vg3fwHozO",
		someId: "_1j3LM6lKkKzRIt19ImYVnD",
		subClass: "_13LGdX8RMStbBE9w-t0gZ1"
	}, "?module");
	testLocal("class name parsing", ".-a0-34a___f { color: red; }", [
		[1, "._1YJOcrkc6cyZmBAAvyPFOn { color: red; }", ""]
	], {
		"-a0-34a___f": "_1YJOcrkc6cyZmBAAvyPFOn"
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
		[1, ".file--bar-1--2ESB7 { color: red; }", ""]
	], {
		"bar-1": "file--bar-1--2ESB7"
	}, "?modules&importLoaders=1&localIdentName=[name]--[local]--[hash:base64:5]");
});
