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
	test("background img absolute", ".class { background: green url(/img.png) xyz }", [
		[1, ".class { background: green url(/img.png) xyz }", ""]
	]);
	test("background img absolute with root", ".class { background: green url(/img.png) xyz }", [
		[1, ".class { background: green url({./img.png}) xyz }", ""]
	], "?root=.");
	test("background img external",
		".class { background: green url(data:image/png;base64,AAA) url(http://example.com/image.jpg) url(//example.com/image.png) xyz }", [
		[1, ".class { background: green url(data:image/png;base64,AAA) url(http://example.com/image.jpg) url(//example.com/image.png) xyz }", ""]
	]);
	test("background img external data",
		".class { background-image: url(\"data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 26' fill='%23007aff'><rect width='4' height='4'/><rect x='8' y='1' width='34' height='2'/><rect y='11' width='4' height='4'/><rect x='8' y='12' width='34' height='2'/><rect y='22' width='4' height='4'/><rect x='8' y='23' width='34' height='2'/></svg>\") }", [
		[1, ".class { background-image: url(\"data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 26' fill='%23007aff'><rect width='4' height='4'/><rect x='8' y='1' width='34' height='2'/><rect y='11' width='4' height='4'/><rect x='8' y='12' width='34' height='2'/><rect y='22' width='4' height='4'/><rect x='8' y='23' width='34' height='2'/></svg>\") }", ""]
	]);
	test("data url in filter",
		".class { filter: url('data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"filter\"><feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"0\" /><feOffset dx=\"1\" dy=\"2\" result=\"offsetblur\" /><feFlood flood-color=\"rgba(255,255,255,1)\" /><feComposite in2=\"offsetblur\" operator=\"in\" /><feMerge><feMergeNode /><feMergeNode in=\"SourceGraphic\" /></feMerge></filter></svg>#filter'); }", [
		[1, ".class { filter: url('data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"filter\"><feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"0\" /><feOffset dx=\"1\" dy=\"2\" result=\"offsetblur\" /><feFlood flood-color=\"rgba(255,255,255,1)\" /><feComposite in2=\"offsetblur\" operator=\"in\" /><feMerge><feMergeNode /><feMergeNode in=\"SourceGraphic\" /></feMerge></filter></svg>#filter'); }", ""]
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

	test("background img with url", ".class { background: green url( \"img.png\" ) xyz }", [
		[1, ".class { background: green url( \"img.png\" ) xyz }", ""]
	], "?-url");
	test("background img 2 with url", ".class { background: green url(~img/png) url(aaa) xyz }", [
		[1, ".class { background: green url(~img/png) url(aaa) xyz }", ""]
	], "?-url");
	test("background img 3 with url", ".class { background: green url( 'img.png' ) xyz }", [
		[1, ".class { background: green url( 'img.png' ) xyz }", ""]
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
	test("data url in filter with url",
		".class { filter: url('data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"filter\"><feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"0\" /><feOffset dx=\"1\" dy=\"2\" result=\"offsetblur\" /><feFlood flood-color=\"rgba(255,255,255,1)\" /><feComposite in2=\"offsetblur\" operator=\"in\" /><feMerge><feMergeNode /><feMergeNode in=\"SourceGraphic\" /></feMerge></filter></svg>#filter'); }", [
		[1, ".class { filter: url('data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"filter\"><feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"0\" /><feOffset dx=\"1\" dy=\"2\" result=\"offsetblur\" /><feFlood flood-color=\"rgba(255,255,255,1)\" /><feComposite in2=\"offsetblur\" operator=\"in\" /><feMerge><feMergeNode /><feMergeNode in=\"SourceGraphic\" /></feMerge></filter></svg>#filter'); }", ""]
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
});
