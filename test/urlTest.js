/*globals describe */

var test = require("./helpers").test;

describe("url", function() {
	test("background img", ".class { background: green url( \"img.png\" ) xyz }", [
		[1, ".class { background: green url({./img.png}) xyz }", ""]
	]);
	test("background img 2", ".class { background: green url(~img/png) url(aaa) xyz }", [
		[1, ".class { background: green url({img/png}) url({./aaa}) xyz }", ""]
	]);
	test("background img 3", ".class { background: green url( 'img.png' ) xyz }", [
		[1, ".class { background: green url({./img.png}) xyz }", ""]
	]);
	test("background img 4", ".class { background: green url( img.png ) xyz }", [
		[1, ".class { background: green url({./img.png}) xyz }", ""]
	]);
	test("background img contain space in name", ".class { background: green url( \"img img.png\" ) xyz }", [
		[1, ".class { background: green url(\"{./img img.png}\") xyz }", ""]
	]);
	test("background 2 img contain space in name", ".class { background: green url( 'img img.png' ) xyz }", [
		[1, ".class { background: green url('{./img img.png}') xyz }", ""]
	]);
	test("background img absolute", ".class { background: green url(/img.png) xyz }", [
		[1, ".class { background: green url(/img.png) xyz }", ""]
	]);
	test("background img absolute with root", ".class { background: green url(/img.png) xyz }", [
		[1, ".class { background: green url({./img.png}) xyz }", ""]
	], "?root=.");
	test("background img absolute with root", ".class { background: green url(/img.png) xyz }", [
		[1, ".class { background: green url({./img.png}) xyz }", ""]
	], "?root=./");
	test("root with absolute url", ".class { background: green url(/img.png) xyz }", [
		[1, ".class { background: green url(http://some.cdn.com/img.png) xyz }", ""]
	], "?root=http://some.cdn.com");
	test("root with absolute url with trailing slash", ".class { background: green url(/img.png) xyz }", [
		[1, ".class { background: green url(http://some.cdn.com/img.png) xyz }", ""]
	], "?root=http://some.cdn.com/");
	test("background img external",
		".class { background: green url(data:image/png;base64,AAA) url(http://example.com/image.jpg) url(//example.com/image.png) xyz }", [
		[1, ".class { background: green url(data:image/png;base64,AAA) url(http://example.com/image.jpg) url(//example.com/image.png) xyz }", ""]
	]);
	test("background img external data",
		".class { background-image: url(\"data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 26' fill='%23007aff'><rect width='4' height='4'/><rect x='8' y='1' width='34' height='2'/><rect y='11' width='4' height='4'/><rect x='8' y='12' width='34' height='2'/><rect y='22' width='4' height='4'/><rect x='8' y='23' width='34' height='2'/></svg>\") }", [
		[1, ".class { background-image: url(\"data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 26' fill='%23007aff'><rect width='4' height='4'/><rect x='8' y='1' width='34' height='2'/><rect y='11' width='4' height='4'/><rect x='8' y='12' width='34' height='2'/><rect y='22' width='4' height='4'/><rect x='8' y='23' width='34' height='2'/></svg>\") }", ""]
	]);
	test("background img external encoded data",
		".class { background-image: url(\"data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2042%2026%27%20fill%3D%27%2523007aff%27%3E%3Crect%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%271%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3Crect%20y%3D%2711%27%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2712%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3Crect%20y%3D%2722%27%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2723%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3C%2Fsvg%3E\") }", [
			[1, ".class { background-image: url(\"data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2042%2026%27%20fill%3D%27%2523007aff%27%3E%3Crect%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%271%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3Crect%20y%3D%2711%27%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2712%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3Crect%20y%3D%2722%27%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2723%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3C%2Fsvg%3E\") }", ""]
		]);
	test("data url in filter",
		".class { filter: url('data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"filter\"><feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"0\" /><feOffset dx=\"1\" dy=\"2\" result=\"offsetblur\" /><feFlood flood-color=\"rgba(255,255,255,1)\" /><feComposite in2=\"offsetblur\" operator=\"in\" /><feMerge><feMergeNode /><feMergeNode in=\"SourceGraphic\" /></feMerge></filter></svg>#filter'); }", [
		[1, ".class { filter: url('data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"filter\"><feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"0\" /><feOffset dx=\"1\" dy=\"2\" result=\"offsetblur\" /><feFlood flood-color=\"rgba(255,255,255,1)\" /><feComposite in2=\"offsetblur\" operator=\"in\" /><feMerge><feMergeNode /><feMergeNode in=\"SourceGraphic\" /></feMerge></filter></svg>#filter'); }", ""]
	]);
	test("encoded data url in filter",
		".class { filter: url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%5C%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%5C%22%3E%3Cfilter%20id%3D%5C%22filter%5C%22%3E%3CfeGaussianBlur%20in%3D%5C%22SourceAlpha%5C%22%20stdDeviation%3D%5C%220%5C%22%20%2F%3E%3CfeOffset%20dx%3D%5C%221%5C%22%20dy%3D%5C%222%5C%22%20result%3D%5C%22offsetblur%5C%22%20%2F%3E%3CfeFlood%20flood-color%3D%5C%22rgba(255%2C255%2C255%2C1)%5C%22%20%2F%3E%3CfeComposite%20in2%3D%5C%22offsetblur%5C%22%20operator%3D%5C%22in%5C%22%20%2F%3E%3CfeMerge%3E%3CfeMergeNode%20%2F%3E%3CfeMergeNode%20in%3D%5C%22SourceGraphic%5C%22%20%2F%3E%3C%2FfeMerge%3E%3C%2Ffilter%3E%3C%2Fsvg%3E%23filter'); }", [
			[1, ".class { filter: url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%5C%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%5C%22%3E%3Cfilter%20id%3D%5C%22filter%5C%22%3E%3CfeGaussianBlur%20in%3D%5C%22SourceAlpha%5C%22%20stdDeviation%3D%5C%220%5C%22%20%2F%3E%3CfeOffset%20dx%3D%5C%221%5C%22%20dy%3D%5C%222%5C%22%20result%3D%5C%22offsetblur%5C%22%20%2F%3E%3CfeFlood%20flood-color%3D%5C%22rgba(255%2C255%2C255%2C1)%5C%22%20%2F%3E%3CfeComposite%20in2%3D%5C%22offsetblur%5C%22%20operator%3D%5C%22in%5C%22%20%2F%3E%3CfeMerge%3E%3CfeMergeNode%20%2F%3E%3CfeMergeNode%20in%3D%5C%22SourceGraphic%5C%22%20%2F%3E%3C%2FfeMerge%3E%3C%2Ffilter%3E%3C%2Fsvg%3E%23filter'); }", ""]
		]);
	test("filter hash",
		".highlight { filter: url(#highlight); }", [
		[1, ".highlight { filter: url(#highlight); }", ""]
	]);
	test("filter hash quotation marks",
		".highlight { filter: url('#line-marker'); }", [
		[1, ".highlight { filter: url('#line-marker'); }", ""]
	]);
	test("font face", "@font-face { src: url(regular.woff) format('woff'), url(~truetype/regular.ttf) format('truetype') }", [
		[1, "@font-face { src: url({./regular.woff}) format('woff'), url({truetype/regular.ttf}) format('truetype') }", ""]
	]);
	test("media query", "@media (min-width: 500px) { body { background: url(image.png); } }", [
		[1, "@media (min-width: 500px) { body { background: url({./image.png}); } }", ""]
	]);
	test("url in string", "a { content: \"do not use url(path)\"; } b { content: 'do not \"use\" url(path)'; }", [
		[1, "a { content: \"do not use url(path)\"; } b { content: 'do not \"use\" url(path)'; }", ""]
	]);
	test("keyframe background img", "@keyframes anim { background: green url('img.png') xyz }", [
		[1, "@keyframes anim { background: green url({./img.png}) xyz }", ""]
	]);
	test("-webkit-image-set", ".a { background-image: -webkit-image-set(url('url1x.png') 1x, url('url2x.png') 2x) }", [
		[1, ".a { background-image: -webkit-image-set(url({./url1x.png}) 1x, url({./url2x.png}) 2x) }", ""]
	]);
	test("empty url", ".class { background: green url() xyz }", [
		[1, ".class { background: green url() xyz }", ""]
	]);
	test("empty url with quotes", ".class { background: green url('') xyz }", [
		[1, ".class { background: green url('') xyz }", ""]
	]);
	test("empty url with spaces and quotes", ".class { background: green url('   ') xyz }", [
		[1, ".class { background: green url('') xyz }", ""]
	]);
	test("empty url with newline and quotes", ".class { background: green url('\n') xyz }", [
		[1, ".class { background: green url('') xyz }", ""]
	]);
	test("empty url with CRLF and quotes", ".class { background: green url('\r\n') xyz }", [
		[1, ".class { background: green url('') xyz }", ""]
	]);
	test("empty url with tab and quotes", ".class { background: green url('\t') xyz }", [
		[1, ".class { background: green url('') xyz }", ""]
	]);
	test("external absolute url", ".class { background: green url(https://raw.githubusercontent.com/webpack/media/master/logo/icon.png) xyz }", [
		[1, ".class { background: green url(https://raw.githubusercontent.com/webpack/media/master/logo/icon.png) xyz }", ""]
	]);
	test("external schema-less url", ".class { background: green url(//raw.githubusercontent.com/webpack/media/master/logo/icon.png) xyz }", [
		[1, ".class { background: green url(//raw.githubusercontent.com/webpack/media/master/logo/icon.png) xyz }", ""]
	]);

	test("background img with url", ".class { background: green url( \"img.png\" ) xyz }", [
		[1, ".class { background: green url( \"img.png\" ) xyz }", ""]
	], "?-url");
	test("background img 2 with url", ".class { background: green url(~img/png) url(aaa) xyz }", [
		[1, ".class { background: green url(~img/png) url(aaa) xyz }", ""]
	], "?-url");
	test("background img 3 with url", ".class { background: green url( 'img.png' ) xyz }", [
		[1, ".class { background: green url( 'img.png' ) xyz }", ""]
	], "?-url");
	test("background img 4 with url", ".class { background: green url( img.png ) xyz }", [
		[1, ".class { background: green url( img.png ) xyz }", ""]
	], "?-url");
	test("background img with url contain space in name", ".class { background: green url( \"img img.png\" ) xyz }", [
		[1, ".class { background: green url( \"img img.png\" ) xyz }", ""]
	], "?-url");
	test("background 2 img with url contain space in name", ".class { background: green url( 'img img.png' ) xyz }", [
		[1, ".class { background: green url( 'img img.png' ) xyz }", ""]
	], "?-url");
	test("background img absolute with url", ".class { background: green url(/img.png) xyz }", [
		[1, ".class { background: green url(/img.png) xyz }", ""]
	], "?-url");
	test("background img external with url",
		".class { background: green url(data:image/png;base64,AAA) url(http://example.com/image.jpg) url(//example.com/image.png) xyz }", [
		[1, ".class { background: green url(data:image/png;base64,AAA) url(http://example.com/image.jpg) url(//example.com/image.png) xyz }", ""]
	], "?-url");
	test("background img external data with url",
		".class { background-image: url(\"data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 26' fill='%23007aff'><rect width='4' height='4'/><rect x='8' y='1' width='34' height='2'/><rect y='11' width='4' height='4'/><rect x='8' y='12' width='34' height='2'/><rect y='22' width='4' height='4'/><rect x='8' y='23' width='34' height='2'/></svg>\") }", [
		[1, ".class { background-image: url(\"data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 26' fill='%23007aff'><rect width='4' height='4'/><rect x='8' y='1' width='34' height='2'/><rect y='11' width='4' height='4'/><rect x='8' y='12' width='34' height='2'/><rect y='22' width='4' height='4'/><rect x='8' y='23' width='34' height='2'/></svg>\") }", ""]
	], "?-url");
	test("background img external encoded data with url",
		".class { background-image: url(\"data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2042%2026%27%20fill%3D%27%2523007aff%27%3E%3Crect%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%271%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3Crect%20y%3D%2711%27%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2712%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3Crect%20y%3D%2722%27%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2723%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3C%2Fsvg%3E\") }", [
			[1, ".class { background-image: url(\"data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2042%2026%27%20fill%3D%27%2523007aff%27%3E%3Crect%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%271%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3Crect%20y%3D%2711%27%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2712%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3Crect%20y%3D%2722%27%20width%3D%274%27%20height%3D%274%27%2F%3E%3Crect%20x%3D%278%27%20y%3D%2723%27%20width%3D%2734%27%20height%3D%272%27%2F%3E%3C%2Fsvg%3E\") }", ""]
		], "?-url");
	test("data url in filter with url",
		".class { filter: url('data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"filter\"><feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"0\" /><feOffset dx=\"1\" dy=\"2\" result=\"offsetblur\" /><feFlood flood-color=\"rgba(255,255,255,1)\" /><feComposite in2=\"offsetblur\" operator=\"in\" /><feMerge><feMergeNode /><feMergeNode in=\"SourceGraphic\" /></feMerge></filter></svg>#filter'); }", [
		[1, ".class { filter: url('data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"filter\"><feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"0\" /><feOffset dx=\"1\" dy=\"2\" result=\"offsetblur\" /><feFlood flood-color=\"rgba(255,255,255,1)\" /><feComposite in2=\"offsetblur\" operator=\"in\" /><feMerge><feMergeNode /><feMergeNode in=\"SourceGraphic\" /></feMerge></filter></svg>#filter'); }", ""]
	], "?-url");
	test("encoded data url in filter with url",
		".class { filter: url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%5C%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%5C%22%3E%3Cfilter%20id%3D%5C%22filter%5C%22%3E%3CfeGaussianBlur%20in%3D%5C%22SourceAlpha%5C%22%20stdDeviation%3D%5C%220%5C%22%20%2F%3E%3CfeOffset%20dx%3D%5C%221%5C%22%20dy%3D%5C%222%5C%22%20result%3D%5C%22offsetblur%5C%22%20%2F%3E%3CfeFlood%20flood-color%3D%5C%22rgba(255%2C255%2C255%2C1)%5C%22%20%2F%3E%3CfeComposite%20in2%3D%5C%22offsetblur%5C%22%20operator%3D%5C%22in%5C%22%20%2F%3E%3CfeMerge%3E%3CfeMergeNode%20%2F%3E%3CfeMergeNode%20in%3D%5C%22SourceGraphic%5C%22%20%2F%3E%3C%2FfeMerge%3E%3C%2Ffilter%3E%3C%2Fsvg%3E%23filter'); }", [
			[1, ".class { filter: url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%5C%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%5C%22%3E%3Cfilter%20id%3D%5C%22filter%5C%22%3E%3CfeGaussianBlur%20in%3D%5C%22SourceAlpha%5C%22%20stdDeviation%3D%5C%220%5C%22%20%2F%3E%3CfeOffset%20dx%3D%5C%221%5C%22%20dy%3D%5C%222%5C%22%20result%3D%5C%22offsetblur%5C%22%20%2F%3E%3CfeFlood%20flood-color%3D%5C%22rgba(255%2C255%2C255%2C1)%5C%22%20%2F%3E%3CfeComposite%20in2%3D%5C%22offsetblur%5C%22%20operator%3D%5C%22in%5C%22%20%2F%3E%3CfeMerge%3E%3CfeMergeNode%20%2F%3E%3CfeMergeNode%20in%3D%5C%22SourceGraphic%5C%22%20%2F%3E%3C%2FfeMerge%3E%3C%2Ffilter%3E%3C%2Fsvg%3E%23filter'); }", ""]
		], "?-url");
	test("filter hash with url",
		".highlight { filter: url(#highlight); }", [
		[1, ".highlight { filter: url(#highlight); }", ""]
	], "?-url");
	test("filter hash quotation marks with url",
		".highlight { filter: url('#line-marker'); }", [
		[1, ".highlight { filter: url('#line-marker'); }", ""]
	], "?-url");
	test("font face with url", "@font-face { src: url(regular.woff) format('woff'), url(~truetype/regular.ttf) format('truetype') }", [
		[1, "@font-face { src: url(regular.woff) format('woff'), url(~truetype/regular.ttf) format('truetype') }", ""]
	], "?-url");
	test("media query with url", "@media (min-width: 500px) { body { background: url(image.png); } }", [
		[1, "@media (min-width: 500px) { body { background: url(image.png); } }", ""]
	], "?-url");
	test("url in string with url", "a { content: \"do not use url(path)\"; } b { content: 'do not \"use\" url(path)'; }", [
		[1, "a { content: \"do not use url(path)\"; } b { content: 'do not \"use\" url(path)'; }", ""]
	], "?-url");
	test("keyframe background img with url", "@keyframes anim { background: green url('img.png') xyz }", [
		[1, "@keyframes anim { background: green url('img.png') xyz }", ""]
	], "?-url");
	test("empty url", ".class { background: green url() xyz }", [
		[1, ".class { background: green url() xyz }", ""]
	], "?-url");
	test("empty url with quotes", ".class { background: green url('') xyz }", [
		[1, ".class { background: green url('') xyz }", ""]
	], "?-url");
	test("empty url with spaces and quotes", ".class { background: green url('   ') xyz }", [
		[1, ".class { background: green url('   ') xyz }", ""]
	], "?-url");
	test("empty url with newline and quotes", ".class { background: green url('\n') xyz }", [
		[1, ".class { background: green url('\n') xyz }", ""]
	], "?-url");
	test("empty url with CRLF and quotes", ".class { background: green url('\r\n') xyz }", [
		[1, ".class { background: green url('\r\n') xyz }", ""]
	], "?-url");
	test("empty url with tab and quotes", ".class { background: green url('\t') xyz }", [
		[1, ".class { background: green url('\t') xyz }", ""]
	], "?-url");
	test("external absolute url", ".class { background: green url(https://raw.githubusercontent.com/webpack/media/master/logo/icon.png) xyz }", [
		[1, ".class { background: green url(https://raw.githubusercontent.com/webpack/media/master/logo/icon.png) xyz }", ""]
	], "?-url");
	test("external schema-less url", ".class { background: green url(//raw.githubusercontent.com/webpack/media/master/logo/icon.png) xyz }", [
		[1, ".class { background: green url(//raw.githubusercontent.com/webpack/media/master/logo/icon.png) xyz }", ""]
	], "?-url");
});
