/*globals describe */

var test = require("./helpers").testWithoutLocals;

var path = require("path");
var fs = require("fs");
var testCasesPath = path.join(__dirname, "moduleTestCases");
var testCases = fs.readdirSync(testCasesPath);

describe("module", function() {
	testCases.forEach(function(name) {
		var source = fs.readFileSync(path.join(testCasesPath, name, "source.css"), "utf-8");
		var expected = fs.readFileSync(path.join(testCasesPath, name, "expected.css"), "utf-8");

		test(name, source, [[1, expected, ""]], "?module&localIdentName=_[local]_");
	});
});
