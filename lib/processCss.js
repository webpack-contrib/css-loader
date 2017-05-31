/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var formatCodeFrame = require("babel-code-frame");
var Tokenizer = require("css-selector-tokenizer");
var postcss = require("postcss");
var loaderUtils = require("loader-utils");
var assign = require("object-assign");
var getLocalIdent = require("./getLocalIdent");

var icssUtils = require('icss-utils');
var localByDefault = require("postcss-modules-local-by-default");
var extractImports = require("postcss-modules-extract-imports");
var modulesScope = require("postcss-modules-scope");
var modulesValues = require("postcss-modules-values");
var valueParser = require('postcss-value-parser');

var parserPlugin = postcss.plugin("css-loader-parser", function(options) {
	return function(css) {
		var imports = {};
		var exports = {};
		var importItems = [];
		var urlItems = [];

		function replaceImportsInString(str) {
			if(options.import) {
				var tokens = valueParser(str);
				tokens.walk(function (node) {
					if (node.type !== 'word') {
						return;
					}
					var token = node.value;
					var importIndex = imports["$" + token];
					if(typeof importIndex === "number") {
						node.value = "___CSS_LOADER_IMPORT___" + importIndex + "___";
					}
				})
				return tokens.toString();
			}
			return str;
		}

		if(options.import) {
			css.walkAtRules(/import/i, function(rule) {
				var values = Tokenizer.parseValues(rule.params);
				var url = values.nodes[0].nodes[0];
				if(url.type === "url") {
					url = url.url;
				} else if(url.type === "string") {
					url = url.value;
				} else throw rule.error("Unexpected format " + rule.params);
				if (!url.replace(/\s/g, '').length) {
					return;
				}
				values.nodes[0].nodes.shift();
				var mediaQuery = Tokenizer.stringifyValues(values);
				if(loaderUtils.isUrlRequest(url, options.root) && options.mode === "global") {
					url = loaderUtils.urlToRequest(url, options.root);
				}
				importItems.push({
					url: url,
					mediaQuery: mediaQuery
				});
				rule.remove();
			});
		}

		var icss = icssUtils.extractICSS(css);
		exports = icss.icssExports;
		Object.keys(icss.icssImports).forEach(function(key) {
			var url = loaderUtils.parseString(key);
			Object.keys(icss.icssImports[key]).forEach(function(prop) {
				imports["$" + prop] = importItems.length;
				importItems.push({
					url: url,
					export: icss.icssImports[key][prop]
				});
			})
		});

		Object.keys(exports).forEach(function(exportName) {
			exports[exportName] = replaceImportsInString(exports[exportName]);
		});

		function processNode(item) {
			switch (item.type) {
				case "value":
					item.nodes.forEach(processNode);
					break;
				case "nested-item":
					item.nodes.forEach(processNode);
					break;
				case "item":
					var importIndex = imports["$" + item.name];
					if (typeof importIndex === "number") {
						item.name = "___CSS_LOADER_IMPORT___" + importIndex + "___";
					}
					break;
				case "url":
					if (options.url && item.url.replace(/\s/g, '').length && !/^#/.test(item.url) && loaderUtils.isUrlRequest(item.url, options.root)) {
						// Don't remove quotes around url when contain space
						if (item.url.indexOf(" ") === -1) {
							item.stringType = "";
						}
						delete item.innerSpacingBefore;
						delete item.innerSpacingAfter;
						var url = item.url;
						item.url = "___CSS_LOADER_URL___" + urlItems.length + "___";
						urlItems.push({
							url: url
						});
					}
					break;
			}
		}

		function processSelectorNode(item) {
			// Helper for walking selector nodes and transforming :ref into
			// references to mangled classnames in other CSS modules
			// See the comment below in the walkRules block
			switch (item.type) {
				case 'selectors':
				case 'nested-pseudo-class':
				case 'selector':
					// Just descend into children for these things
					item.nodes.forEach(processSelectorNode);
					break;
				case 'pseudo-class':
					if (item.name === 'ref') {
						// We found :ref(...)
						// It has a selector inside it.
						// Parse it as a selector and rewrite the name or id to an import.
						var refSelectorList = Tokenizer.parse(item.content);
						if (!refSelectorList) {
							throw new Error('Not a valid selector inside :ref! ' + item.content);
						}
						if (refSelectorList.nodes.length !== 1) {
							throw new Error('Selector inside :ref must have exactly one part! ' + item.content);
						}
						var refSelector = refSelectorList.nodes[0];
						if (refSelector.nodes.length !== 1) {
							throw new Error('Selector inside :ref must have exactly one part! ' + item.content);
						}
						var refSelectorElement = refSelector.nodes[0];
						if (refSelectorElement.type !== 'class' && refSelectorElement.type !== 'id') {
							throw new Error('Selector inside :ref must be an id or class! ' + item.content);
						}
						var importIndex = imports['$' + refSelectorElement.name];
						if (typeof importIndex !== 'number') {
							throw new Error('Could not find :ref ' + refSelectorElement.name);
						}

						// Rewrite item to be a class or id equivalent to what is inside :ref
						item.type = refSelectorElement.type;
						item.name = "___CSS_LOADER_IMPORT___" + importIndex + "___";
						delete item.content;
					}
					break;
			}
		}

		css.walkRules(function(rule){
			// Transform all references of the type :ref(.classname|#id) into the actual
			// mangled classname/id imported from another file.
			// Turns something like this
			// :import('otherfile.css') {
			// 	classB: classB;
			// }
			// .file_classA_abcdefg > :ref(.classB) {
			// 	...
			// }
			// ...into...
			// .file_classA_abcdefg > .otherfile_classB_hijklmn {
			// 	...
			// }
			var selectorParseTree = Tokenizer.parse(rule.selector);
			// Mutates the nodes inside the selector parse tree.
			processSelectorNode(selectorParseTree);
			rule.selector = Tokenizer.stringify(selectorParseTree);
		});

		css.walkDecls(function(decl) {
			var values = Tokenizer.parseValues(decl.value);
			values.nodes.forEach(function(value) {
				value.nodes.forEach(processNode);
			});
			decl.value = Tokenizer.stringifyValues(values);
		});
		css.walkAtRules(function(atrule) {
			if(typeof atrule.params === "string") {
				atrule.params = replaceImportsInString(atrule.params);
			}
		});

		options.importItems = importItems;
		options.urlItems = urlItems;
		options.exports = exports;
	};
});

module.exports = function processCss(inputSource, inputMap, options, callback) {
	var query = options.query;
	var root = query.root && query.root.length > 0 ? query.root.replace(/\/$/, "") : query.root;
	var context = query.context;
	var localIdentName = query.localIdentName || "[hash:base64]";
	var localIdentRegExp = query.localIdentRegExp;
	var forceMinimize = query.minimize;
	var minimize = typeof forceMinimize !== "undefined" ? !!forceMinimize : options.minimize;

	var customGetLocalIdent = query.getLocalIdent || getLocalIdent;

	var parserOptions = {
		root: root,
		mode: options.mode,
		url: query.url !== false,
		import: query.import !== false
	};

	var pipeline = postcss([
		modulesValues,
		localByDefault({
			mode: options.mode,
			rewriteUrl: function(global, url) {
				if(parserOptions.url){
                    url = url.trim();

					if(!url.replace(/\s/g, '').length || !loaderUtils.isUrlRequest(url, root)) {
						return url;
					}
					if(global) {
						return loaderUtils.urlToRequest(url, root);
					}
				}
				return url;
			}
		}),
		extractImports(),
		modulesScope({
			generateScopedName: function generateScopedName (exportName) {
				return customGetLocalIdent(options.loaderContext, localIdentName, exportName, {
					regExp: localIdentRegExp,
					hashPrefix: query.hashPrefix || "",
					context: context
				});
			}
		}),
		parserPlugin(parserOptions)
	]);

	if(minimize) {
		var cssnano = require("cssnano");
		var minimizeOptions = assign({}, query.minimize);
		["zindex", "normalizeUrl", "discardUnused", "mergeIdents", "reduceIdents", "autoprefixer"].forEach(function(name) {
			if(typeof minimizeOptions[name] === "undefined")
				minimizeOptions[name] = false;
		});
		pipeline.use(cssnano(minimizeOptions));
	}

	pipeline.process(inputSource, {
		// we need a prefix to avoid path rewriting of PostCSS
		from: "/css-loader!" + options.from,
		to: options.to,
		map: options.sourceMap ? {
			prev: inputMap,
			sourcesContent: true,
			inline: false,
			annotation: false
		} : null
	}).then(function(result) {
		callback(null, {
			source: result.css,
			map: result.map && result.map.toJSON(),
			exports: parserOptions.exports,
			importItems: parserOptions.importItems,
			importItemRegExpG: /___CSS_LOADER_IMPORT___([0-9]+)___/g,
			importItemRegExp: /___CSS_LOADER_IMPORT___([0-9]+)___/,
			urlItems: parserOptions.urlItems,
			urlItemRegExpG: /___CSS_LOADER_URL___([0-9]+)___/g,
			urlItemRegExp: /___CSS_LOADER_URL___([0-9]+)___/
		});
	}).catch(function(err) {
		if (err.name === 'CssSyntaxError') {
			var wrappedError = new CSSLoaderError(
				'Syntax Error',
				err.reason,
				err.line != null && err.column != null
					? {line: err.line, column: err.column}
					: null,
				err.input.source
			);
			callback(wrappedError);
		} else {
			callback(err);
		}
	});
};

function formatMessage(message, loc, source) {
	var formatted = message;
	if (loc) {
		formatted = formatted
			+ ' (' + loc.line + ':' + loc.column + ')';
	}
	if (loc && source) {
		formatted = formatted
			+ '\n\n' + formatCodeFrame(source, loc.line, loc.column) + '\n';
	}
	return formatted;
}

function CSSLoaderError(name, message, loc, source, error) {
	Error.call(this);
	Error.captureStackTrace(this, CSSLoaderError);
	this.name = name;
	this.error = error;
	this.message = formatMessage(message, loc, source);
	this.hideStack = true;
}

CSSLoaderError.prototype = Object.create(Error.prototype);
CSSLoaderError.prototype.constructor = CSSLoaderError;
