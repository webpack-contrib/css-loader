/*globals describe, it */

require("should");
var getImportPrefix = require("../lib/getImportPrefix");

describe("import", function() {
	it("should return an empty string when importLoaders is false", function() {
		var prefix = getImportPrefix({}, { importLoaders: false });
		prefix.should.be.equal("");
	});

	it("should return the current loader when importLoaders is 0", function() {
		var loaders = [
			{ request: "one" },
			{ request: "two" },
			{ request: "three" }
		];
		var prefix = getImportPrefix({ loaderIndex: 0, loaders: loaders }, { importLoaders: 0 });
		prefix.should.be.equal("-!one!");
	});

	it("should concatenate loader when importLoaders > 0", function() {
		var loaders = [
			{ request: "one" },
			{ request: "two" },
			{ request: "three" }
		];
		var prefix = getImportPrefix({ loaderIndex: 1, loaders: loaders }, { importLoaders: 1 });
		prefix.should.be.equal("-!two!three!");
	});

});
