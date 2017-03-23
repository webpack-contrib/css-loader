/*globals describe */

var test = require("./helpers").test;
var testLocal = require("./helpers").testLocal;

describe("localByDefault", function() {
  test("should not impact when not modules unset", ".myclass { color: green; }", [
    [1, ".myclass { color: green; }", ""]
  ], '?localByDefault');
  testLocal("modules true should use :local by default", ".myclass { color: green; }", [
    [1, ".__2NVVs { color: green; }", ""],
  ], {
    myclass: "__2NVVs"
  }, "?modules&localIdentName=__[hash:base64:5]");
  testLocal("should use :local for localByDefault true", ".myclass { color: green; }", [
    [1, ".__2NVVs { color: green; }", ""],
  ], {
    myclass: "__2NVVs"
  }, "?modules&localIdentName=__[hash:base64:5]&localByDefault");
  test("should use :global for localByDefault false", ".myclass { color: green; }", [
    [1, ".myclass { color: green; }", ""],
  ], "?modules&localIdentName=__[hash:base64:5]&localByDefault=false");
});
