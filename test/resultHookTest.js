/*globals describe */

require("should");
var testResultHook = require("./helpers").testResultHook;
var cssLoader = require("../index.js");
var cssLoaderLocals = require("../locals.js");

describe("resultHook", function() {
	testResultHook("calls resultHook with the loader context and the result", cssLoader);
	testResultHook("works with the locals loader", cssLoaderLocals);
});
