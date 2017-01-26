/*globals describe */

var test = require("./helpers").test;

describe("import", function() {
	var module2 = {
		$css: {
			id: 2,
			content: ".test{a: b};",
			imports: []
		}
	};
	var module1 = {
		$css: {
			id: 1,
			content: ".class { a: b c d; }",
			imports: [
				[module2.$css, undefined]
			]
		}
	};
	var module3 = {
		$css: {
			id: 1,
			content: ".class { a: b c d; }",
			imports: [
				[ module1.$css, "screen" ],
				[ module2.$css, "screen and print" ]
			]
		}
	};
	var module4 = {
		$css: {
			id: 1,
			content: "",
			imports: [
				[{
					id: 1,
					content: "@import url(http://example.com/style.css);",
					imports: []
				}, undefined],
				[{
					id: 1,
					content: "@import url(//example.com/style.css);",
					imports: []
				}, undefined]
			]
		}
	};
	var module5 = {
		$css: {
			id: 1,
			content: "@import url(test.css);\n.class { a: b c d; }",
			imports: []
		}
	};

	test("import", "@import url(test.css);\n.class { a: b c d; }", module1, "", {
		"./test.css": module2
	});

	test("import with string", "@import \"test.css\";\n.class { a: b c d; }", module1, "", {
		"./test.css": module2
	});

	test("import with media", "@import url('test2.css') screen;\n@import url('test.css') screen and print;\n.class { a: b c d; }", module3, "", {
		"./test2.css": module1,
		"./test.css": module2
	});

	test("import external", "@import url(http://example.com/style.css);\n@import url(\"//example.com/style.css\");", module4);

	test("import disabled", "@import url(test.css);\n.class { a: b c d; }", module5, "?-import");
});
