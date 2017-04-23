/*globals describe */

var test = require("./helpers").test;

describe("import", function() {
	test("import", "@import url(test.css);\n.class { a: b c d; }", [
		[2, ".test{a: b}", ""],
		[1, ".class { a: b c d; }", ""]
	], "", {
		"./test.css": [[2, ".test{a: b}", ""]]
	});
	test("import camelcase", "@IMPORT url(test.css);\n.class { a: b c d; }", [
		[2, ".test{a: b}", ""],
		[1, ".class { a: b c d; }", ""]
	], "", {
		"./test.css": [[2, ".test{a: b}", ""]]
	});
    test("import empty url", "@import url();\n.class { a: b c d; }", [
        [1, "@import url();\n.class { a: b c d; }", ""]
    ], "");
    test("import empty url with quotes", "@import url('');\n.class { a: b c d; }", [
        [1, "@import url('');\n.class { a: b c d; }", ""]
    ], "");
	test("import with string", "@import \"test.css\";\n.class { a: b c d; }", [
		[2, ".test{a: b}", ""],
		[1, ".class { a: b c d; }", ""]
	], "", {
		"./test.css": [[2, ".test{a: b}", ""]]
	});
	test("import with empty string", "@import \"\";\n.class { a: b c d; }", [
		[1, "@import \"\";\n.class { a: b c d; }", ""]
	], "");
	test("import with string contain spaces", "@import \"   \";\n.class { a: b c d; }", [
		[1, "@import \"   \";\n.class { a: b c d; }", ""]
	], "");
	test("import with string contain newline", "@import \"\n\";\n.class { a: b c d; }", [
		[1, "@import \"\n\";\n.class { a: b c d; }", ""]
	], "");
	test("import with string contain CRLF", "@import \"\r\n\";\r\n.class { a: b c d; }", [
		[1, "@import \"\r\n\";\r\n.class { a: b c d; }", ""]
	], "");
	test("import with string contain tab", "@import \"\t\";\n.class { a: b c d; }", [
		[1, "@import \"\t\";\n.class { a: b c d; }", ""]
	], "");
	test("import 2", "@import url('test.css');\n.class { a: b c d; }", [
		[2, ".test{a: b}", "screen"],
		[1, ".class { a: b c d; }", ""]
	], "", {
		"./test.css": [[2, ".test{a: b}", "screen"]]
	});
	test("import with media", "@import url('~test/css') screen and print;\n.class { a: b c d; }", [
		[3, ".test{a: b}", "((min-width: 100px)) and (screen and print)"],
		[2, ".test{c: d}", "screen and print"],
		[1, ".class { a: b c d; }", ""]
	], "", {
		"test/css": [
			[3, ".test{a: b}", "(min-width: 100px)"],
			[2, ".test{c: d}", ""]
		]
	});
	test("import external", "@import url(http://example.com/style.css);\n@import url(\"//example.com/style.css\");", [
		[1, "@import url(http://example.com/style.css);", ""],
		[1, "@import url(//example.com/style.css);", ""],
		[1, "", ""]
	]);
	test("import disabled", "@import url(test.css);\n.class { a: b c d; }", [
		[1, "@import url(test.css);\n.class { a: b c d; }", ""]
	], "?-import");
});
