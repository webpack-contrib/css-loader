/*globals describe */

var testWithMap = require("./helpers").testWithMap;
var testMap = require("./helpers").testMap;

describe("source maps", function() {
	testWithMap("falsy: null map doesn't cause an error", ".class { a: b c d; }", null, {
		$css: {
			id: 1,
			content: ".class { a: b c d; }",
			imports: []
		}
	});
	testWithMap("falsy: undefined map doesn't cause an error", ".class { a: b c d; }", undefined, {
		$css: {
			id: 1,
			content: ".class { a: b c d; }",
			imports: []
		}
	});

	var moduleWithSourcemap = {
		$css: {
			id: 1,
			content: ".class { a: b c d; }",
			imports: [],
			sourceMap: {
				file: 'test.css',
				mappings: 'AAAA,SAAS,SAAS,EAAE',
				names: [],
				sourceRoot: 'webpack://',
				sources: [ '/./folder/test.css' ],
				sourcesContent: [ '.class { a: b c d; }' ],
				version: 3
			}
		}
	};
	testMap("generate sourceMap (1 loader)", ".class { a: b c d; }", undefined, {
		loaders: [{request: "/path/css-loader"}],
		options: { context: "/" },
		resource: "/folder/test.css",
		request: "/path/css-loader!/folder/test.css",
		query: "?sourceMap"
	}, moduleWithSourcemap);

	var moduleWithSourcemap2 = {
		$css: {
			id: 1,
			content: ".class { a: b c d; }",
			imports: [],
			sourceMap: {
				file: 'test.css',
				mappings: 'AAAA,SAAS,SAAS,EAAE',
				names: [],
				sourceRoot: 'webpack://',
				sources: [ '/../../folder/test.css' ],
				sourcesContent: [ '.class { a: b c d; }' ],
				version: 3
			}
		}
	};
	testMap("generate sourceMap (1 loader, relative)", ".class { a: b c d; }", undefined, {
		loaders: [{request: "/path/css-loader"}],
		options: { context: "/other-folder/sub" },
		resource: "/folder/test.css",
		request: "/path/css-loader!/folder/test.css",
		query: "?sourceMap"
	}, moduleWithSourcemap2);

	var moduleWithSourcemap3 = {
		$css: {
			id: 1,
			content: ".class { a: b c d; }",
			imports: [],
			sourceMap: {
				file: 'test.scss',
				mappings: 'AAAA,SAAS,SAAS,EAAE',
				names: [],
				sourceRoot: 'webpack://',
				sources: [ '/./folder/test.scss' ],
				sourcesContent: [ '.class { a: b c d; }' ],
				version: 3
			}
		}
	};
	testMap("generate sourceMap (2 loaders)", ".class { a: b c d; }", undefined, {
		loaders: [{request: "/path/css-loader"}, {request: "/path/sass-loader"}],
		options: { context: "/" },
		resource: "/folder/test.scss",
		request: "/path/css-loader!/path/sass-loader!/folder/test.scss",
		query: "?sourceMap"
	}, moduleWithSourcemap3);
});
