/*globals describe */

var assert = require('assert');
var test = require("./helpers").test;
var testError = require("./helpers").testError;
var testMinimize = require("./helpers").testMinimize;

describe("simple", function() {
	test("empty", "", [
		[1, "", ""]
	]);
	testMinimize("empty minimized", "", [
		[1, "", ""]
	]);
	test("simple", ".class { a: b c d; }", [
		[1, ".class { a: b c d; }", ""]
	]);
	test("simple2", ".class { a: b c d; }\n.two {}", [
		[1, ".class { a: b c d; }\n.two {}", ""]
	]);
	testMinimize("minimized simple", ".class { a: b c d; }", [
		[1, ".class{a:b c d}", ""]
	]);
  testError("error formatting", ".some {\n invalid css;\n}", function(err) {
    assert.equal(err.message, [
      'Unknown word (2:2)',
      '',
      '  1 | .some {',
      '> 2 |  invalid css;',
      '    |  ^',
      '  3 | }',
      '',
    ].join('\n'));
  });
});
