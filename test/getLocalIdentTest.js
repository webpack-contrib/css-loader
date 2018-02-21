/*eslint-env mocha*/

var test = require("./helpers").test;

describe("getLocalIdent", function() {
    const css = ".example { color: blue; }";
    const expected = [[ 1, ".uMqYSzdPdY3zp-l0r_9xV { color: blue; }", ""]];
    expected.locals = { example: "uMqYSzdPdY3zp-l0r_9xV" };

    test("should produce same idents with various path separators (/)", css, expected, "?module", undefined, {
        resource: "path/to/test.css",
        resourcePath: "path/to/test.css",
        request: "css-loader!path/to/test.css",
    });

    test("should produce same idents with various path separators (\\)", css, expected, "?module", undefined, {
        resource: "path\\to\\test.css",
        resourcePath: "path\\to\\test.css",
        request: "css-loader!path\\to\\test.css",
    });
});
