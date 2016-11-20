/*globals describe */

var test = require("./helpers").test;

describe("asString", function() {
	test("returns string", ".clear { clear: both; }",
  '.clear { clear: both; }', 
  "?asString=true",
  ""
  );
});
