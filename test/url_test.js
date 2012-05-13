var vows = require("vows");
var assert = require("assert");
var path = require("path");
var cssLoader = require("../index.js");

function test(input, result) {
	return {
		topic: function() {
			var context = {
				options: {
				}
			}
			return cssLoader.call(context, input);
		},

		isCorrect: function(output) {
			if(output instanceof Error)
				throw output;
			assert.equal(output, "module.exports =\n\t" + result.join(" +\n\t") + ";");
		}
	}
}

vows.describe("url").addBatch({
	"simple":  test(".class { a: b c d; }",
					["\".class { a: b c d; }\""]),
	"simple2": test(".class { a: b c d; }\n.two {}",
					["\".class { a: b c d; }\\n.two {}\""]),
	"import":  test("@import url(test.css);\n.class { a: b c d; }",
					["require("+JSON.stringify(path.join(__dirname, "..", "index.js")+"!./test.css")+")",
						"\"\\n.class { a: b c d; }\""]),
	"import with media":
				test("@import url(~test/css) screen and print;\n.class { a: b c d; }",
					["\"@media screen and print{\"",
						"require("+JSON.stringify(path.join(__dirname, "..", "index.js")+"!test/css")+")",
						"\"}\"",
						"\"\\n.class { a: b c d; }\""]),
	"background img":
				test(".class { background: green url( \"img.png\" ) xyz }",
					["\".class { background: green url( \"+require(\"file/auto!./img.png\")+\" ) xyz }\""]),
	"background img 2":
				test(".class { background: green url(~img/png ) xyz }",
					["\".class { background: green url(\"+require(\"file/auto!img/png\")+\" ) xyz }\""])
}).export(module);