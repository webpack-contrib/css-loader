/*globals describe it*/

var base = require("../lib/css-base");

describe("css-base", function() {
	it("should toString a single module", function() {
		var m = base();
		m.push([1, "body { a: 1; }", ""]);
		m.toString().should.be.eql("body { a: 1; }");
	});
	it("should toString multiple modules", function() {
		var m = base();
		m.push([2, "body { b: 2; }", ""]);
		m.push([1, "body { a: 1; }", ""]);
		m.toString().should.be.eql("body { b: 2; }body { a: 1; }");
	});
	it("should toString with media query", function() {
		var m = base();
		m.push([1, "body { a: 1; }", "screen"]);
		m.toString().should.be.eql("@media screen{body { a: 1; }}");
	});
	it("should import modules", function() {
		var m = base();
		var m1 = [1, "body { a: 1; }", "screen"];
		var m2 = [2, "body { b: 2; }", ""];
		var m3 = [3, "body { c: 3; }", ""];
		var m4 = [4, "body { d: 4; }", ""];
		m.i([m2, m3], "");
		m.i([m2], "");
		m.i([m2, m4], "print");
		m.push(m1);
		m.toString().should.be.eql("body { b: 2; }" +
			"body { c: 3; }" +
			"@media print{body { d: 4; }}" +
			"@media screen{body { a: 1; }}");
	});
});
