/*globals describe */

var testWithMap = require("./helpers").testWithMap;

describe("falsy source maps", function() {
	testWithMap("null map doesn't cause an error", ".class { a: b c d; }", null, [
		[1, ".class { a: b c d; }", ""]
	]);
	testWithMap("undefined map doesn't cause an error", ".class { a: b c d; }", undefined, [
		[1, ".class { a: b c d; }", ""]
	]);
});
