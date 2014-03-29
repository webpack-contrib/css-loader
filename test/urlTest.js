var should = require("should");
var path = require("path");
var cssLoader = require("../index.js");

function test(name, input, result, query) {
	it(name, function() {
		var output;
		cssLoader.call({
			loaders: [{request: "loader"}],
			loaderIndex: 0,
			resource: "test.css",
			query: query,
			callback: function(err, result) {
				output = result;
			}
		}, input);
		output.should.be.eql("module.exports =\n\t" + result.join(" +\n\t") + ";");
	});
}

function testMinimize(name, input, result) {
	it(name, function() {
		var output;
		cssLoader.call({
			loaders: [{request: "loader"}],
			loaderIndex: 0,
			resource: "test.css",
			minimize: true,
			callback: function(err, result) {
				output = result;
			}
		}, input);
		output.should.be.eql("module.exports =\n\t" + result.join(" +\n\t") + ";");
	});
}

describe("url", function() {
	test("empty", "",
					["\"\""]);
	testMinimize("empty minimized", "",
					["\"\""]);
	test("simple", ".class { a: b c d; }",
					["\".class { a: b c d; }\""]);
	test("simple2", ".class { a: b c d; }\n.two {}",
					["\".class { a: b c d; }\\n.two {}\""]);
	test("import", "@import url(test.css);\n.class { a: b c d; }",
					["require("+JSON.stringify("!"+path.join(__dirname, "..", "index.js")+"!./test.css")+")",
						"\"\\n.class { a: b c d; }\""]);
	test("import with media", "@import url(~test/css) screen and print;\n.class { a: b c d; }",
					["\"@media screen and print{\"",
						"require("+JSON.stringify("!"+path.join(__dirname, "..", "index.js")+"!test/css")+")",
						"\"}\"",
						"\"\\n.class { a: b c d; }\""]);
	test("import external", "@import url(http://example.com/style.css);\n@import url(\"//example.com/style.css\");",
					["\"@import url(http://example.com/style.css);\"",
						"\"@import url(//example.com/style.css);\"",
						"\"\\n\""]);
	test("background img", ".class { background: green url( \"img.png\" ) xyz }",
					["\".class { background: green url( \"+require(\"./img.png\")+\" ) xyz }\""]);
	test("background img 2", ".class { background: green url(~img/png ) url(aaa) xyz }",
					["\".class { background: green url(\"+require(\"img/png\")+\" ) url(\"+require(\"./aaa\")+\") xyz }\""]);
	test("background img absolute", ".class { background: green url(/img.png) xyz }",
					["\".class { background: green url(/img.png) xyz }\""]);
	test("background img absolute with root", ".class { background: green url(/img.png) xyz }",
					["\".class { background: green url(\"+require(\"./img.png\")+\") xyz }\""], "?root=.");
	test("background img external",
		".class { background: green url(data:image/png;base64,AAA) url(http://example.com/image.jpg) url(//example.com/image.png) xyz }",
		["\".class { background: green url(data:image/png;base64,AAA) url(http://example.com/image.jpg) url(//example.com/image.png) xyz }\""]);
	test("filter hash",
		".highlight { filter: url(#highlight); }",
		["\".highlight { filter: url(#highlight); }\""]);
	test("font face", "@font-face { src: url(regular.woff) format('woff'), url(~truetype/regular.ttf) format('truetype') }",
					["\"@font-face { src: url(\"+require(\"./regular.woff\")+\") format('woff'), url(\"+require(\"truetype/regular.ttf\")+\") format('truetype') }\""]);
	test("media query", "@media (min-width: 500px) { body { background: url(image.png); } }",
					["\"@media (min-width: 500px) { body { background: url(\"+require(\"./image.png\")+\"); } }\""]);
	testMinimize("minimized simple", ".class { a: b c d; }",
					["\".class{a:b c d}\""]);
});