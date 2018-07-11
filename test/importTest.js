/*globals describe */

var assert = require("assert");

var helpers = require("./helpers");
var test = helpers.test;
var testError = helpers.testError;

describe("import", function() {
  test(
    "url",
    "@import url(test.css);\n.class { a: b c d; }",
    [[2, ".test{a: b}", ""], [1, ".class { a: b c d; }", ""]],
    "",
    {
      "./test.css": [[2, ".test{a: b}", ""]]
    }
  );
  test(
    "url with quotes",
    "@import url('test.css');\n.class { a: b c d; }",
    [[2, ".test{a: b}", "screen"], [1, ".class { a: b c d; }", ""]],
    "",
    {
      "./test.css": [[2, ".test{a: b}", "screen"]]
    }
  );
  test(
    "at-rule in uppercase",
    "@IMPORT url(test.css);\n.class { a: b c d; }",
    [[2, ".test{a: b}", ""], [1, ".class { a: b c d; }", ""]],
    "",
    {
      "./test.css": [[2, ".test{a: b}", ""]]
    }
  );
  test(
    "url in uppercase",
    "@import URL(test.css);\n.class { a: b c d; }",
    [[2, ".test{a: b}", ""], [1, ".class { a: b c d; }", ""]],
    "",
    {
      "./test.css": [[2, ".test{a: b}", ""]]
    }
  );
  test(
    "empty url",
    "@import url();\n.class { a: b c d; }",
    [[1, "@import url();\n.class { a: b c d; }", ""]],
    ""
  );
  test(
    "empty url with quotes",
    "@import url('');\n.class { a: b c d; }",
    [[1, "@import url('');\n.class { a: b c d; }", ""]],
    ""
  );
  test(
    "string",
    '@import "test.css";\n.class { a: b c d; }',
    [[2, ".test{a: b}", ""], [1, ".class { a: b c d; }", ""]],
    "",
    {
      "./test.css": [[2, ".test{a: b}", ""]]
    }
  );
  test(
    "empty string",
    '@import "";\n.class { a: b c d; }',
    [[1, '@import "";\n.class { a: b c d; }', ""]],
    ""
  );
  test(
    "string contain spaces",
    '@import "   ";\n.class { a: b c d; }',
    [[1, '@import "   ";\n.class { a: b c d; }', ""]],
    ""
  );
  test(
    "string contain newline",
    '@import "\n";\n.class { a: b c d; }',
    [[1, '@import "\n";\n.class { a: b c d; }', ""]],
    ""
  );
  test(
    "string contain CRLF",
    '@import "\r\n";\r\n.class { a: b c d; }',
    [[1, '@import "\r\n";\r\n.class { a: b c d; }', ""]],
    ""
  );
  test(
    "string contain tab",
    '@import "\t";\n.class { a: b c d; }',
    [[1, '@import "\t";\n.class { a: b c d; }', ""]],
    ""
  );
  test(
    "duplicate",
    "@import url(test.css);@import url(test.css);\n.class { a: b c d; }",
    [[2, ".test{a: b}", ""], [1, ".class { a: b c d; }", ""]],
    "",
    {
      "./test.css": [[2, ".test{a: b}", ""]]
    }
  );
  test(
    "media",
    "@import url(test.css) screen and print;\n.class { a: b c d; }",
    [[2, ".test{a: b}", "screen and print"], [1, ".class { a: b c d; }", ""]],
    "",
    {
      "./test.css": [[2, ".test{a: b}", ""]]
    }
  );
  test(
    "media without space between url and media",
    "@import url(test.css)screen and print;\n.class { a: b c d; }",
    [[2, ".test{a: b}", "screen and print"], [1, ".class { a: b c d; }", ""]],
    "",
    {
      "./test.css": [[2, ".test{a: b}", ""]]
    }
  );
  test(
    "duplicate with same media",
    "@import url(test.css) screen and print;@import url(test.css) screen and print;\n.class { a: b c d; }",
    [[2, ".test{a: b}", "screen and print"], [1, ".class { a: b c d; }", ""]],
    "",
    {
      "./test.css": [[2, ".test{a: b}", ""]]
    }
  );
  test(
    "nested media",
    "@import url('~test/css') screen and print;\n.class { a: b c d; }",
    [
      [3, ".test{a: b}", "((min-width: 100px)) and (screen and print)"],
      [2, ".test{c: d}", "screen and print"],
      [1, ".class { a: b c d; }", ""]
    ],
    "",
    {
      "test/css": [
        [3, ".test{a: b}", "(min-width: 100px)"],
        [2, ".test{c: d}", ""]
      ]
    }
  );
  test(
    "external",
    '@import url(http://example.com/style.css);\n@import url("//example.com/style.css");',
    [
      [1, "@import url(http://example.com/style.css);", ""],
      [1, "@import url(//example.com/style.css);", ""],
      [1, "", ""]
    ]
  );
  test(
    "disabled",
    "@import url(test.css);\n.class { a: b c d; }",
    [[1, "@import url(test.css);\n.class { a: b c d; }", ""]],
    "?-import"
  );
  test("non standard at-rule contain import word", "@import-normalize;", [
    [1, "@import-normalize;", ""]
  ]);
  testError("without url", "@import;", function(err) {
    assert.equal(
      err.message,
      ["Unexpected format  (1:1)", "", "> 1 | @import;", "    | ^", ""].join(
        "\n"
      )
    );
  });
});
