var testLocals = require("./helpers").testLocals;

describe("cssText", function() {
	testLocals("should module.exports.__cssText__ processed css text",
		".abc { color: red; }",
		{
      abc: '_file__abc',
      __cssText__: '._file__abc { color: red; }'
		},
		"?modules&localIdentName=_[name]__[local]&cssText"
	);
});
