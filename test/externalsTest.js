/*globals describe, before, after */

var test = require("./helpers").test;

function testLocal(name, input, result, localsResult, query, modules) {
	result.locals = localsResult;
	test(name, input, result, query, modules);
}

describe("externals", function() {
	before(function () {
		global.External = {
			c2: "imported-c2",
			c4: "imported-c4"
		};
	});

	[
		{
			name: "composes class from external module, with query string",
			query: '?localIdentName=_[local]&externals={"external":"External"}',
		},
		{
			name: "composes class from external module, with externals as an array",
			query: '?{"localIdentName":"_[local]","externals":[{"external":"External"}]}',
		}
	].forEach(function (t) {
		testLocal(
			// name
			t.name,

			// input
			[
				":local(.c1) { composes: c2 from \"external\"; b: 1; }",
				":local(.c3) { composes: c1; b: 3; }",
				":local(.c5) { composes: c2 c4 from \"external\"; b: 5; }"
			].join("\n"),

			// result
			[
				[
					1,
					[
						"._c1 { b: 1; }",
						"._c3 { b: 3; }",
						"._c5 { b: 5; }"
					].join("\n"), ""
				]
			],

			// localsResult
			{
				c1: "_c1 imported-c2",
				c3: "_c3 _c1 imported-c2",
				c5: "_c5 imported-c2 imported-c4"
			},

			// query
			t.query,

			// modules
			{}
		);
	});

	after(function () {
		delete global.External;
	})
});
