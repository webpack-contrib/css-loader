/*globals describe */

var testLocals = require("./helpers").testLocals;

describe("customGetLocalIdent", function() {
	testLocals("should return only locals",
		".abc :local(.def) { color: red; } :local .ghi .jkl { color: blue; }",
		{
			def: "foo",
			ghi: "foo",
			jkl: "foo"
		},
        {
            getLocalIdent: function () {
                return 'foo'
            }
        }
	);
});
