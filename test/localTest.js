/*globals describe */

var test = require("./helpers").test;
var testMinimize = require("./helpers").testMinimize;
var cssBase = require("../lib/css-base");
var camelCase = require("../lib/camelCase");

function testLocal(name, input, result, localsResult, query, modules) {
	Object.keys(localsResult).map(function(key) {
		var newKey = camelCase(key, query && query.camelCaseKeys ? query.camelCaseKeys : false);
		result[newKey] = localsResult[key];
	});
	result.default = cssBase(localsResult, input);
	test(name, input, result, query, modules);
}

function testLocalMinimize(name, input, result, localsResult, query, modules) {
	Object.assign(result, localsResult);
	result.default = cssBase(localsResult, input);
	testMinimize(name, input, result, query, modules);
}

describe("local", function() {
	testLocal("locals-format", ":local(.test) { background: red; }", {
		$css: {
			id:1,
			content: ".test-2_pBx { background: red; }",
			imports: []
		}
	}, {
		test: "test-2_pBx"
	}, "?localIdentName=[local]-[hash:base64:5]");

	testLocal("locals", ":local(.className) { background: red; }\n:local(#someId) { background: green; }\n" +
		":local(.className .subClass) { color: green; }\n:local(#someId .subClass) { color: blue; }", {
			$css: {
				id: 1,
				content: "._23J0282swY7bwvI2X4fHiV { background: red; }\n#_3vpqN0v_IxlO3TzQjbpB33 { background: green; }\n" +
				"._23J0282swY7bwvI2X4fHiV ._1s1VsToXFz17cPAltMg7jz { color: green; }\n#_3vpqN0v_IxlO3TzQjbpB33 ._1s1VsToXFz17cPAltMg7jz { color: blue; }",
				imports: []
			}
	}, {
		className: "_23J0282swY7bwvI2X4fHiV",
		someId: "_3vpqN0v_IxlO3TzQjbpB33",
		subClass: "_1s1VsToXFz17cPAltMg7jz"
	});
	testLocalMinimize("minimized plus local", ":local(.localClass) { background: red; }\n:local .otherClass { background: red; }\n:local(.empty) { }", {
		$css: {
			id: 1,
			content:  "._localClass,._otherClass{background:red}",
			imports:[]
		}
	}, {
		localClass: "_localClass",
		otherClass: "_otherClass",
		empty: "_empty"
	}, "?localIdentName=_[local]");

	testLocal("mode switching", ".c1 :local .c2 .c3 :global .c4 :local .c5, .c6 :local .c7 { background: red; }\n.c8 { background: red; }", {
		$css: {
			id: 1,
			content: ".c1 ._c2 ._c3 .c4 ._c5, .c6 ._c7 { background: red; }\n.c8 { background: red; }",
			imports: []
		}
	}, {
		c2: "_c2",
		c3: "_c3",
		c5: "_c5",
		c7: "_c7"
	}, "?localIdentName=_[local]");

	testLocal("comment in local", ":local(.c1/*.c2*/.c3) { background: red; }", {
		$css: {
			id: 1, 
			content: "._c1._c3 { background: red; }", 
			imports:[]
		}
	}, {
		c1: "_c1",
		c3: "_c3"
	}, "?localIdentName=_[local]");

	testLocal("comment in local", ":local(.c1/*.c2*/.c3) { background: red; }", {
		$css: {
			id: 1,
			content: "._c1._c3 { background: red; }",
			imports: []
		}
	}, {
		c1: "_c1",
		c3: "_c3"
	}, "?localIdentName=_[local]");

	testLocal("strings in local", ":local(.c1[data-attr=\".c2)]'\"]:not(.c3):not(.c4)) { background: red; }", {
		$css: {
			id: 1,
			content: "._c1[data-attr=\".c2)]'\"]:not(._c3):not(._c4) { background: red; }",
			imports: []
		}
	}, {
		c1: "_c1",
		c3: "_c3",
		c4: "_c4"
	}, "?localIdentName=_[local]");

	testLocal("composes class simple", ":local(.c1) { a: 1; }\n:local(.c2) { composes: c1; b: 1; }", {
		$css: {
			id: 1,
			content: "._c1 { a: 1; }\n._c2 { b: 1; }",
			imports: []
		}
	}, {
		c1: "_c1",
		c2: "_c2 _c1"
	}, "?localIdentName=_[local]");

	var module_with_class = {
		$css: {
			id: 2,
			content: ".test{c: d}",
			imports: []
		},
		c2: "imported-c2",
		c4: "imported-c4"
	};
	testLocal("composes class from module", [
		":local(.c1) { composes: c2 from \"./module\"; b: 1; }",
		":local(.c3) { composes: c1; b: 3; }",
		":local(.c5) { composes: c2 c4 from \"./module\"; b: 5; }"
	].join("\n"), {
		$css: {
			id: 1,
			content: [
				"._c1 { b: 1; }",
				"._c3 { b: 3; }",
				"._c5 { b: 5; }"
			].join("\n"),
			imports: [
				[module_with_class.$css, undefined]
			]
		}
	}, {
		c1: "_c1 imported-c2",
		c3: "_c3 _c1 imported-c2",
		c5: "_c5 imported-c2 imported-c4"
	}, "?localIdentName=_[local]", {
		"./module": module_with_class
	});

	// Not sure about this test, as imported symbols now never have hyphens
	var module_with_hyphenated_class = {
		$css: {
			id: 2,
			content: ".test{c: d}",
			imports: []
		},
		c2: "imported-c-2",
		c4: "imported-c4"
	};
	testLocal("composes class with hyphen from module", [
		":local(.c1) { composes: c-2 from \"./module\"; b: 1; }",
		":local(.c3) { composes: c1; b: 3; }",
		":local(.c5) { composes: c-2 c4 from \"./module\"; b: 5; }"
	].join("\n"), {
		$css: {
			id: 1,
			content: [
				"._c1 { b: 1; }",
				"._c3 { b: 3; }",
				"._c5 { b: 5; }"
			].join("\n"),
			imports: [
				[module_with_hyphenated_class.$css, undefined]
			]
		}
	}, {
		c1: "_c1 imported-c-2",
		c3: "_c3 _c1 imported-c-2",
		c5: "_c5 imported-c-2 imported-c4"
	}, "?localIdentName=_[local]", {
		"./module": module_with_hyphenated_class
	});

	var module_with_import = {
		$css: {
			id: 2,
			content: ".test{c: d}",
			imports: []
		},
		c2: "imported-c2",
		c3: "imported-c3",
		c4: "imported-c4"
	};
	testLocal("composes class from module with import", [
		"@import url(\"module\");",
		":local(.c1) { composes: c2 c3 from \"./module\"; composes: c4 from \"./module\"; b: 1; }"
	].join("\n"), {
		$css: {
			id: 1,
			content: "._c1 { b: 1; }",
			imports: [
				[module_with_import.$css, undefined]
			]
		}
	}, {
		c1: "_c1 imported-c2 imported-c3 imported-c4"
	}, "?localIdentName=_[local]", {
		"./module": module_with_import
	});

	var module_mode = {
		$css: {
			id: 1,
			content: "._23J0282swY7bwvI2X4fHiV { background: url({./file.png}); }\n#_3vpqN0v_IxlO3TzQjbpB33 { background: url({module/file.jpg}); }\n" +
			"._23J0282swY7bwvI2X4fHiV ._1s1VsToXFz17cPAltMg7jz { font-size: 5.5pt; }\n#_3vpqN0v_IxlO3TzQjbpB33 ._1s1VsToXFz17cPAltMg7jz { color: blue; }",
			imports: []
		}
	};
	testLocal("module mode", ".className { background: url(./file.png); }\n#someId { background: url('module/file.jpg'); }\n" +
		".className .subClass { font-size: 5.5pt; }\n#someId .subClass { color: blue; }", module_mode, {
		className: "_23J0282swY7bwvI2X4fHiV",
		someId: "_3vpqN0v_IxlO3TzQjbpB33",
		subClass: "_1s1VsToXFz17cPAltMg7jz"
	}, "?module");

	var module_class_name_parsing = {
		$css: {
			id: 1,
			content: "._3ZMCqVa1XidxdqbX65hZ5D { color: red; }",
			imports: []
		}
	};
	testLocal("class name parsing", ".-a0-34a___f { color: red; }", module_class_name_parsing, {
		"-a0-34a___f": "_3ZMCqVa1XidxdqbX65hZ5D"
	}, "?module");

	var imported_module_decl = {
		$css: {
			id: 2,
			content: "",
			imports: []
		},
		primaryColor: "red",
		default: {
			"primary-color": "red"
		}
	}
	var module_imported_decl = {
		$css: {
			id: 1,
			content: "._className { color: red; }",
			imports: [
				[ imported_module_decl.$css, undefined ]
			]
		}
	};
	testLocal("imported values in decl", ".className { color: IMPORTED_NAME; }\n" +
		":import(\"./vars.css\") { IMPORTED_NAME: primary-color; }", module_imported_decl, {
		"className": "_className"
	}, "?module&localIdentName=_[local]", {
		"./vars.css": imported_module_decl
	});

	var module_109 = {
		$css: {
			id: 1,
			content: ".file--bar-1--2JvfJ { color: red; }",
			imports: []
		}
	};
	testLocal("issue-109", ".bar-1 { color: red; }", module_109, {
		"bar-1": "file--bar-1--2JvfJ"
	}, "?modules&importLoaders=1&localIdentName=[name]--[local]--[hash:base64:5]");

	var module_path_naming = {
		$css: {
			id: 1,
			content: ".path-to--file--bar { color: red; }",
			imports: []
		}
	};
	testLocal("path naming", ".bar { color: red; }", module_path_naming, {
		"bar": "path-to--file--bar"
	}, {
		query: "?modules&localIdentName=[path]-[name]--[local]",
		resourcePath: "/root/path/to/file.css",
		options: {
			context: "/root/"
		}
	});

	var module_path_naming_context = {
		$css: {
			id: 1,
			content:  ".to--file--bar { color: red; }",
			imports: []
		}
	};
	testLocal("path naming with context", ".bar { color: red; }", module_path_naming_context, {
		"bar": "to--file--bar"
	}, {
		query: "?modules&localIdentName=[path]-[name]--[local]&context=/root/path",
		resourcePath: "/root/path/to/file.css",
		options: {
			context: "/root/"
		}
	});

	var module_hash_prefix = {
		$css: {
			id: 1,
			content: ".bar--58a3b08b9195a6af0de7431eaf3427c7 { color: red; }",
			imports: []
		}
	};
	testLocal("hash prefix", ".bar { color: red; }", module_hash_prefix, {
		"bar": "bar--58a3b08b9195a6af0de7431eaf3427c7"
	}, "?modules&localIdentName=[local]--[hash]&hashPrefix=x");

	var module_prefix_digit_underscore = {
		$css: {
			id: 1,
			content:  "._1test { background: red; }",
			imports: []
		}
	};
	testLocal("prefixes leading digit with underscore", ":local(.test) { background: red; }", module_prefix_digit_underscore, {
		test: "_1test"
	}, "?localIdentName=1[local]");

	var module_prefix_hyphen_digit_underscore = {
		$css: {
			id: 1,
			content: "._-1test { background: red; }",
			imports: []
		}
	};
	testLocal("prefixes leading hyphen + digit with underscore", ":local(.test) { background: red; }", module_prefix_hyphen_digit_underscore, {
		test: "_-1test"
	}, "?localIdentName=-1[local]");

	var module_prefix_2_hyphen_underscore = {
		$css: {
			id: 1,
			content: "._--test { background: red; }",
			imports: []
		}
	};
	testLocal("prefixes two leading hyphens with underscore", ":local(.test) { background: red; }", module_prefix_2_hyphen_underscore, {
		test: "_--test"
	}, "?localIdentName=--[local]");
});
