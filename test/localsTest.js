/*globals describe */

var testLocals = require("./helpers").testLocals;

describe("locals", function() {
	testLocals("should return only locals",
		".abc :local(.def) { color: red; } :local .ghi .jkl { color: blue; }",
		{
			def: "_def",
			ghi: "_ghi",
			jkl: "_jkl"
		},
		"?localIdentName=_[local]"
	);
	testLocals("should return only locals with composing",
		":local(.abc) { color: red; } :local(.def) { composes: abc; background: green; }",
		{
			abc: "_abc",
			def: "_def _abc"
		},
		"?localIdentName=_[local]"
	);
	testLocals("should return only locals with importing",
		":local(.abc) { composes: def from \"./module.css\"; }",
		{
			abc: "_abc imported_def imported_ghi"
		},
		"?localIdentName=_[local]",
		{
			"./module.css": {
				def: "imported_def imported_ghi",
				ghi: "imported_ghi"
			}
		}
	);
	testLocals("should return only locals with importing",
		":local(.abc) { composes: def from \"./module1.css\"; composes: def from \"./module2.css\"; }",
		{
			abc: "_abc imported_def1 imported_ghi1 imported_def2"
		},
		"?localIdentName=_[local]",
		{
			"./module1.css": {
				def: "imported_def1 imported_ghi1",
				ghi: "imported_ghi1"
			},
			"./module2.css": {
				def: "imported_def2"
			}
		}
	);
});
