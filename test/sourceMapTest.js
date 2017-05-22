/*globals describe */

var testWithMap = require("./helpers").testWithMap;
var testMap = require("./helpers").testMap;

describe("source maps", function() {
	testWithMap("falsy: null map doesn't cause an error", ".class { a: b c d; }", null, [
		[1, ".class { a: b c d; }", ""]
	]);
	testWithMap("falsy: undefined map doesn't cause an error", ".class { a: b c d; }", undefined, [
		[1, ".class { a: b c d; }", ""]
	]);
	testWithMap("should don't generate sourceMap when `sourceMap: false` and map exists",
		".class { a: b c d; }",
		{
			file: 'test.css',
			mappings: 'AAAA,SAAS,SAAS,EAAE',
			names: [],
			sourceRoot: '',
			sources: [ '/folder/test.css' ],
			sourcesContent: [ '.class { a: b c d; }' ],
			version: 3
		},
		[
			[1, ".class { a: b c d; }", ""]
		],
		{
			sourceMap: false
		}
	);
	testWithMap("should don't generate sourceMap when `sourceMap: true` and map exists",
		".class { a: b c d; }",
		{
			file: 'test.css',
			mappings: 'AAAA,SAAS,SAAS,EAAE',
			names: [],
			sourceRoot: '',
			sources: [ '/folder/test.css' ],
			sourcesContent: [ '.class { a: b c d; }' ],
			version: 3
		},
		[
			[1, ".class { a: b c d; }", "", {
				file: 'test.css',
				mappings: 'AAAA,SAAS,SAAS,EAAE',
				names: [],
				sourceRoot: '',
				sources: [ '/folder/test.css' ],
				sourcesContent: [ '.class { a: b c d; }' ],
				version: 3
			}]
		],
		{
			sourceMap: true
		}
	);
    testWithMap("should don't generate sourceMap when `sourceMap: true` and map exists and string",
        ".class { a: b c d; }",
        JSON.stringify({
            file: 'test.css',
            mappings: 'AAAA,SAAS,SAAS,EAAE',
            names: [],
            sourceRoot: '',
            sources: [ '/folder/test.css' ],
            sourcesContent: [ '.class { a: b c d; }' ],
            version: 3
        }),
        [
            [1, ".class { a: b c d; }", "", {
                file: 'test.css',
                mappings: 'AAAA,SAAS,SAAS,EAAE',
                names: [],
                sourceRoot: '',
                sources: [ '/folder/test.css' ],
                sourcesContent: [ '.class { a: b c d; }' ],
                version: 3
            }]
        ],
        {
            sourceMap: true
        }
    );
	testMap("generate sourceMap (1 loader)", ".class { a: b c d; }", undefined, {
		loaders: [{request: "/path/css-loader"}],
		resource: "/folder/test.css",
		request: "/path/css-loader!/folder/test.css",
		query: "?sourceMap"
	}, [
		[1, ".class { a: b c d; }", "", {
			file: 'test.css',
			mappings: 'AAAA,SAAS,SAAS,EAAE',
			names: [],
			sourceRoot: '',
			sources: [ '/folder/test.css' ],
			sourcesContent: [ '.class { a: b c d; }' ],
			version: 3
		}]
	]);
	testMap("generate sourceMap (1 loader, relative)", ".class { a: b c d; }", undefined, {
		loaders: [{request: "/path/css-loader"}],
		resource: "/folder/test.css",
		request: "/path/css-loader!/folder/test.css",
		query: "?sourceMap"
	}, [
		[1, ".class { a: b c d; }", "", {
			file: 'test.css',
			mappings: 'AAAA,SAAS,SAAS,EAAE',
			names: [],
			sourceRoot: '',
			sources: [ '/folder/test.css' ],
			sourcesContent: [ '.class { a: b c d; }' ],
			version: 3
		}]
	]);
	testMap("generate sourceMap (1 loader, data url)", ".class { background-image: url(\"data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 26' fill='%23007aff'><rect width='4' height='4'/><rect x='8' y='1' width='34' height='2'/><rect y='11' width='4' height='4'/><rect x='8' y='12' width='34' height='2'/><rect y='22' width='4' height='4'/><rect x='8' y='23' width='34' height='2'/></svg>\"); }", undefined, {
		loaders: [{request: "/path/css-loader"}],
		resource: "/folder/test.css",
		request: "/path/css-loader!/folder/test.css",
		query: "?sourceMap"
	}, [
		[1,  ".class { background-image: url(\"data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 26' fill='%23007aff'><rect width='4' height='4'/><rect x='8' y='1' width='34' height='2'/><rect y='11' width='4' height='4'/><rect x='8' y='12' width='34' height='2'/><rect y='22' width='4' height='4'/><rect x='8' y='23' width='34' height='2'/></svg>\"); }", "", {
			file: 'test.css',
			mappings: 'AAAA,SAAS,6WAA6W,EAAE',
			names: [],
			sourceRoot: '',
			sources: [ '/folder/test.css' ],
			sourcesContent: [ '.class { background-image: url("data:image/svg+xml;charset=utf-8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 42 26\' fill=\'%23007aff\'><rect width=\'4\' height=\'4\'/><rect x=\'8\' y=\'1\' width=\'34\' height=\'2\'/><rect y=\'11\' width=\'4\' height=\'4\'/><rect x=\'8\' y=\'12\' width=\'34\' height=\'2\'/><rect y=\'22\' width=\'4\' height=\'4\'/><rect x=\'8\' y=\'23\' width=\'34\' height=\'2\'/></svg>"); }' ],
			version: 3
		}]
	]);
	testMap("generate sourceMap (1 loader, encoded data url)", ".class { background-image: url(\"data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2042%2026%27%20fill%3D%27%23007aff%27%3E%3Crect%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%271%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3Crect%20y%3D%2711%27%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2712%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3Crect%20y%3D%2722%27%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2723%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3C%2Fsvg%3E\"); }", undefined, {
		loaders: [{request: "/path/css-loader"}],
		resource: "/folder/test.css",
		request: "/path/css-loader!/folder/test.css",
		query: "?sourceMap"
	}, [
		[1,  ".class { background-image: url(\"data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2042%2026%27%20fill%3D%27%23007aff%27%3E%3Crect%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%271%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3Crect%20y%3D%2711%27%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2712%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3Crect%20y%3D%2722%27%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2723%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3C%2Fsvg%3E\"); }", "", {
			file: 'test.css',
			mappings: 'AAAA,SAAS,mmBAAmmB,EAAE',
			names: [],
			sourceRoot: '',
			sources: [ '/folder/test.css' ],
			sourcesContent: [ '.class { background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2042%2026%27%20fill%3D%27%23007aff%27%3E%3Crect%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%271%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3Crect%20y%3D%2711%27%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2712%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3Crect%20y%3D%2722%27%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2723%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3C%2Fsvg%3E"); }' ],
			version: 3
		}]
	]);
	testMap("generate sourceMap (2 loaders)", ".class { a: b c d; }", undefined, {
		loaders: [{request: "/path/css-loader"}, {request: "/path/sass-loader"}],
		resource: "/folder/test.scss",
		request: "/path/css-loader!/path/sass-loader!/folder/test.scss",
		query: "?sourceMap"
	}, [
		[1, ".class { a: b c d; }", "", {
			file: 'test.scss',
			mappings: 'AAAA,SAAS,SAAS,EAAE',
			names: [],
			sourceRoot: '',
			sources: [ '/folder/test.scss' ],
			sourcesContent: [ '.class { a: b c d; }' ],
			version: 3
		}]
	]);
	testMap("generate sourceMap (2 loaders) and map exist", ".class { a: b c d; }", {
		file: 'test.scss',
		mappings: 'AAAA,SAAS,SAAS,EAAE',
		names: [],
		sourceRoot: '',
		sources: [ '/folder/test.scss' ],
		sourcesContent: [ '.class { a: b c d; }' ],
		version: 3
	}, {
		loaders: [{request: "/path/css-loader"}, {request: "/path/sass-loader"}],
		resource: "/folder/test.scss",
		request: "/path/css-loader!/path/sass-loader!/folder/test.scss",
		query: "?sourceMap"
	}, [
		[1, ".class { a: b c d; }", "", {
			file: 'test.scss',
			mappings: 'AAAA,SAAS,SAAS,EAAE',
			names: [],
			sourceRoot: '',
			sources: [ '/folder/test.scss' ],
			sourcesContent: [ '.class { a: b c d; }' ],
			version: 3
		}]
	]);
	testMap("don't generate sourceMap (1 loader)", ".class { a: b c d; }", undefined, {
		loaders: [{request: "/path/css-loader"}],
		resource: "/folder/test.css",
		request: "/path/css-loader!/folder/test.css",
		query: "?sourceMap=false"
	}, [
		[1, ".class { a: b c d; }", ""]
	]);
});
