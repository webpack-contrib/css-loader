/*globals describe it*/

var base = require("../lib/css-base");
require('should');

describe("css-base", function() {
	it("should toString a single module", function() {
		var m = base({}, {
			id: 1,
			content: "body { a: 1; }",
			imports: []
		});

		m.toString().should.be.eql("body { a: 1; }");
	});
	it("should toString with media query", function() {
		var m = base({}, {
			id: 2,
			content: "",
			imports: [
				[{
					id: 1,
					content: "body { a: 1; }",
				}, "screen"]
			]
		});
		m.toString().should.be.eql("@media screen{body { a: 1; }}");
	});
	it("should import modules", function() {
		var m = base({}, {
			id: 1,
			content: "body { a: 1; }",
			imports: [
				[{
					id: 2,
					content: "body { b: 2; }",
				}, undefined],
				[{
					id: 3,
					content: "body { c: 3; }",
				}, "screen"],
				[{
					id: 4,
					content: "body { d: 4; }",
				}, "print"],
			]
		});
		m.toString().should.be.eql("body { b: 2; }" +
			"@media screen{body { c: 3; }}" +
			"@media print{body { d: 4; }}" +
			"body { a: 1; }"
		);
	});
});
