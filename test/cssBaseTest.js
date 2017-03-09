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
	it("should toString with source mapping", function() {
		var m = base();
		m.push([1, "body { a: 1; }", "", {
			file: "test.scss",
			sources: [
				'./path/to/test.scss'
			],
			mappings: "AAAA;",
			sourceRoot: "webpack://"
		}]);
		m.toString().should.be.eql("body { a: 1; }\n/*# sourceURL=webpack://./path/to/test.scss */\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJmaWxlIjoidGVzdC5zY3NzIiwic291cmNlcyI6WyIuL3BhdGgvdG8vdGVzdC5zY3NzIl0sIm1hcHBpbmdzIjoiQUFBQTsiLCJzb3VyY2VSb290Ijoid2VicGFjazovLyJ9 */");
	});
});
