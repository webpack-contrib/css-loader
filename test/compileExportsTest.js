/*globals describe */

var test = require("./helpers").test;
var cssBase = require("../lib/css-base");

describe("compileExports", function() {
	(function() {
		var css = ".class { color: blue; }";
		var $css = {
			id: 1,
			content: "._142VEwbHMjysmBYg930FF7 { color: blue; }",
			imports: []
		};
		var exports = {
			default: { 'class': '_142VEwbHMjysmBYg930FF7' },
			export: { $_class: '_142VEwbHMjysmBYg930FF7' }
		};

		exports.export.default = cssBase(exports.default, $css);
		exports.export.$css = $css;

		test("should namespace javascript reserved words", css, exports.export, "?modules");
	})();

	(function() {
		var css = "._3 { color: blue; }";
		var $css = {
			id: 1,
			content: ".xmpuyNm-cjfReR8LWwfPY { color: blue; }",
			imports: []
		};
		var exports = {
			default: { '_3': 'xmpuyNm-cjfReR8LWwfPY', '3': 'xmpuyNm-cjfReR8LWwfPY' },
			export: { $_3: 'xmpuyNm-cjfReR8LWwfPY' }
		};

		exports.export.default = cssBase(exports.default, $css);
		exports.export.$css = $css;

		test("should namespaces classnames that become numeric after camel casing", css, exports.export, "?modules&camelCase");
	})();

	(function() {
		var css = "";
		var $css = {
			id: 1,
			content: "",
			imports: []
		};
		var exports = {
			default: { },
			export: { }
		};

		exports.export.$css = $css;

		test("should export nothing when there are no classes", css, exports.export, "?modules&camelCase");
	})();
});
