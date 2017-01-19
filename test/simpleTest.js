/*globals describe */

var assert = require('assert');
var test = require("./helpers").test;
var testError = require("./helpers").testError;
var testMinimize = require("./helpers").testMinimize;

describe("simple", function() {
	test("empty", "", {
		$css: {
			id: 1,
			content: "",
			imports: []
		}
	});
	testMinimize("empty minimized", "", {
		$css: {
			id: 1,
			content: "",
			imports: []
		}
	});
	test("simple", ".class { a: b c d; }", {
		$css: {
			id: 1,
			content: ".class { a: b c d; }",
			imports: []
		}
	});
	test("simple2", ".class { a: b c d; }\n.two {}", {
		$css: {
			id: 1, 
			content: ".class { a: b c d; }\n.two {}",
			imports: []
		}
	});
	testMinimize("minimized simple", ".class { a: b c d; }", {
		$css: {
			id: 1, 
			content: ".class{a:b c d}",
			imports: []
		}
	});
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
