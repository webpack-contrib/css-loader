/*globals describe */

var test = require("./helpers").test;

describe("url", function() {
	test("background img", ".class { background: green url( \"img.png\" ) xyz }", {
		$css: {
			id: 1,
			content: ".class { background: green url({./img.png}) xyz }",
			imports: []
		}
	});
	test("background img 2", ".class { background: green url(~img/png) url(aaa) xyz }", {
		$css: {
			id: 1,
			content: ".class { background: green url({img/png}) url({./aaa}) xyz }",
			imports: []
		}
	});
	test("background img 3", ".class { background: green url( 'img.png' ) xyz }", {
		$css: {
			id: 1,
			content: ".class { background: green url({./img.png}) xyz }",
			imports: []
		}
	});
	test("background img absolute", ".class { background: green url(/img.png) xyz }", {
		$css: {
			id: 1,
			content: ".class { background: green url(/img.png) xyz }",
			imports: []
		}
	});
	test("background img absolute with root", ".class { background: green url(/img.png) xyz }", {
		$css: {
			id: 1,
			content: ".class { background: green url({./img.png}) xyz }",
			imports: []
		}
	}, "?root=.");
	test("background img external",
		".class { background: green url(data:image/png;base64,AAA) url(http://example.com/image.jpg) url(//example.com/image.png) xyz }", {
			$css: {
				id: 1,
				content: ".class { background: green url(data:image/png;base64,AAA) url(http://example.com/image.jpg) url(//example.com/image.png) xyz }",
				imports: []
			}
	});
	test("background img external data",
		".class { background-image: url(\"data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 26' fill='%23007aff'><rect width='4' height='4'/><rect x='8' y='1' width='34' height='2'/><rect y='11' width='4' height='4'/><rect x='8' y='12' width='34' height='2'/><rect y='22' width='4' height='4'/><rect x='8' y='23' width='34' height='2'/></svg>\") }", {
			$css: {
				id: 1,
				content: ".class { background-image: url(\"data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 26' fill='%23007aff'><rect width='4' height='4'/><rect x='8' y='1' width='34' height='2'/><rect y='11' width='4' height='4'/><rect x='8' y='12' width='34' height='2'/><rect y='22' width='4' height='4'/><rect x='8' y='23' width='34' height='2'/></svg>\") }",
				imports: []
			}
	});
	test("data url in filter",
		".class { filter: url('data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"filter\"><feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"0\" /><feOffset dx=\"1\" dy=\"2\" result=\"offsetblur\" /><feFlood flood-color=\"rgba(255,255,255,1)\" /><feComposite in2=\"offsetblur\" operator=\"in\" /><feMerge><feMergeNode /><feMergeNode in=\"SourceGraphic\" /></feMerge></filter></svg>#filter'); }", {
			$css: {
				id: 1,
				content: ".class { filter: url('data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"filter\"><feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"0\" /><feOffset dx=\"1\" dy=\"2\" result=\"offsetblur\" /><feFlood flood-color=\"rgba(255,255,255,1)\" /><feComposite in2=\"offsetblur\" operator=\"in\" /><feMerge><feMergeNode /><feMergeNode in=\"SourceGraphic\" /></feMerge></filter></svg>#filter'); }",
				imports: []
			}
	});
	test("filter hash",
		".highlight { filter: url(#highlight); }", {
			$css: {
				id: 1,
				content: ".highlight { filter: url(#highlight); }",
				imports: []
			}
	});
	test("filter hash quotation marks",
		".highlight { filter: url('#line-marker'); }", {
			$css: {
				id: 1,
				content: ".highlight { filter: url('#line-marker'); }",
				imports: []
			}
	});
	test("font face", "@font-face { src: url(regular.woff) format('woff'), url(~truetype/regular.ttf) format('truetype') }", {
		$css: {
			id: 1,
			content: "@font-face { src: url({./regular.woff}) format('woff'), url({truetype/regular.ttf}) format('truetype') }",
			imports: []
		}
	});
	test("media query", "@media (min-width: 500px) { body { background: url(image.png); } }", {
		$css: {
			id: 1,
			content: "@media (min-width: 500px) { body { background: url({./image.png}); } }",
			imports: []
		}
	});
	test("url in string", "a { content: \"do not use url(path)\"; } b { content: 'do not \"use\" url(path)'; }", {
		$css: {
			id: 1,
			content: "a { content: \"do not use url(path)\"; } b { content: 'do not \"use\" url(path)'; }",
			imports: []
		}
	});
	test("keyframe background img", "@keyframes anim { background: green url('img.png') xyz }", {
		$css: {
			id: 1,
			content: "@keyframes anim { background: green url({./img.png}) xyz }",
			imports: []
		}
	});
	test("-webkit-image-set", ".a { background-image: -webkit-image-set(url('url1x.png') 1x, url('url2x.png') 2x) }", {
		$css: {
			id: 1,
			content: ".a { background-image: -webkit-image-set(url({./url1x.png}) 1x, url({./url2x.png}) 2x) }",
			imports: []
		}
	});

	test("background img with url", ".class { background: green url( \"img.png\" ) xyz }", {
		$css: {
			id: 1,
			content: ".class { background: green url( \"img.png\" ) xyz }",
			imports: []
		}
	}, "?-url");
	test("background img 2 with url", ".class { background: green url(~img/png) url(aaa) xyz }", {
		$css: {
			id: 1,
			content: ".class { background: green url(~img/png) url(aaa) xyz }",
			imports: []
		}
	}, "?-url");
	test("background img 3 with url", ".class { background: green url( 'img.png' ) xyz }", {
		$css: {
			id: 1,
			content: ".class { background: green url( 'img.png' ) xyz }",
			imports: []
		}
	}, "?-url");
	test("background img absolute with url", ".class { background: green url(/img.png) xyz }", {
		$css: {
			id: 1,
			content: ".class { background: green url(/img.png) xyz }",
			imports: []
		}
	}, "?-url");
	test("background img external with url",
		".class { background: green url(data:image/png;base64,AAA) url(http://example.com/image.jpg) url(//example.com/image.png) xyz }", {
			$css: {
				id: 1,
				content: ".class { background: green url(data:image/png;base64,AAA) url(http://example.com/image.jpg) url(//example.com/image.png) xyz }",
				imports: []
			}
	}, "?-url");
	test("background img external data with url",
		".class { background-image: url(\"data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 26' fill='%23007aff'><rect width='4' height='4'/><rect x='8' y='1' width='34' height='2'/><rect y='11' width='4' height='4'/><rect x='8' y='12' width='34' height='2'/><rect y='22' width='4' height='4'/><rect x='8' y='23' width='34' height='2'/></svg>\") }", {
			$css: {
				id: 1,
				content: ".class { background-image: url(\"data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 26' fill='%23007aff'><rect width='4' height='4'/><rect x='8' y='1' width='34' height='2'/><rect y='11' width='4' height='4'/><rect x='8' y='12' width='34' height='2'/><rect y='22' width='4' height='4'/><rect x='8' y='23' width='34' height='2'/></svg>\") }",
				imports: []
			}
	}, "?-url");
	test("data url in filter with url",
		".class { filter: url('data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"filter\"><feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"0\" /><feOffset dx=\"1\" dy=\"2\" result=\"offsetblur\" /><feFlood flood-color=\"rgba(255,255,255,1)\" /><feComposite in2=\"offsetblur\" operator=\"in\" /><feMerge><feMergeNode /><feMergeNode in=\"SourceGraphic\" /></feMerge></filter></svg>#filter'); }", {
			$css: {
				id: 1,
				content: ".class { filter: url('data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"filter\"><feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"0\" /><feOffset dx=\"1\" dy=\"2\" result=\"offsetblur\" /><feFlood flood-color=\"rgba(255,255,255,1)\" /><feComposite in2=\"offsetblur\" operator=\"in\" /><feMerge><feMergeNode /><feMergeNode in=\"SourceGraphic\" /></feMerge></filter></svg>#filter'); }",
				imports: []
			}
	}, "?-url");
	test("filter hash with url",
		".highlight { filter: url(#highlight); }", {
			$css: {
				id: 1,
				content: ".highlight { filter: url(#highlight); }",
				imports: []
			}
	}, "?-url");
	test("filter hash quotation marks with url",
		".highlight { filter: url('#line-marker'); }", {
			$css: {
				id: 1,
				content: ".highlight { filter: url('#line-marker'); }",
				imports: []
			}
	}, "?-url");
	test("font face with url", "@font-face { src: url(regular.woff) format('woff'), url(~truetype/regular.ttf) format('truetype') }", {
		$css: {
			id: 1,
			content: "@font-face { src: url(regular.woff) format('woff'), url(~truetype/regular.ttf) format('truetype') }",
			imports: []
		}
	}, "?-url");
	test("media query with url", "@media (min-width: 500px) { body { background: url(image.png); } }", {
		$css: {
			id: 1,
			content: "@media (min-width: 500px) { body { background: url(image.png); } }",
			imports: []
		}
	}, "?-url");
	test("url in string with url", "a { content: \"do not use url(path)\"; } b { content: 'do not \"use\" url(path)'; }", {
		$css: {
			id: 1,
			content: "a { content: \"do not use url(path)\"; } b { content: 'do not \"use\" url(path)'; }",
			imports: []
		}
	}, "?-url");
	test("keyframe background img with url", "@keyframes anim { background: green url('img.png') xyz }", {
		$css: {
			id: 1,
			content: "@keyframes anim { background: green url('img.png') xyz }",
			imports: []
		}
	}, "?-url");
});
