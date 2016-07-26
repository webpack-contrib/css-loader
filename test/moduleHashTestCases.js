/*globals describe */

var test = require("./helpers").testSelectorIsDifferent;

describe("module", function() {
	test("Hash for different property value",
		".foo { background-color: red; }",
		".foo { background-color: blue; }",
		"?module&sourceMap&localIdentName=_[local]_[hash]"
	);

	test("Hash for different property",
		".foo { color: red; }",
		".foo { background-color: red; }",
		"?module&sourceMap&localIdentName=_[local]_[hash]"
	);

	test("Hash for different content",
		".foo { color: red; }",
		".foo { border: 1px solid #aaa; }",
		"?module&sourceMap&localIdentName=_[local]_[hash]"
	);

	test("Hash for different selector",
		".foo { color: red; }",
		".bar { color: red; }",
		"?module&sourceMap&localIdentName=_[local]_[hash]"
	);
});
