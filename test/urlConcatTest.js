/*globals describe */

var helpers = require("./helpers");
var test = helpers.test;

describe("url concat", function() {
	this.timeout(10000);

	var actualCSS, expectedCSS, i;

	actualCSS = '';
	expectedCSS = '';
	for (i = 0; i < 100; i++) {
		actualCSS += ".class" + i + " { background-image: url(./path/to/file.png); }";
		expectedCSS += ".class" + i + " { background-image: url({./path/to/file.png}); }";
	}

	test("should handle concat of 201 strings", actualCSS, [[1, expectedCSS, ""]]);

	actualCSS = '';
	expectedCSS = '';
	for (i = 0; i < 10000; i++) {
		actualCSS += ".class" + i + " { background-image: url(./path/to/file.png); }";
		expectedCSS += ".class" + i + " { background-image: url({./path/to/file.png}); }";
	}

	test("should handle concat of 20001 strings", actualCSS, [[1, expectedCSS, ""]]);
});
