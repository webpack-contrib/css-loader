/*globals it */

require("should");
var cssLoader = require("../index.js");
var vm = require("vm");

function getEvaluated(output, result, modules) {
	try {
		var fn = vm.runInThisContext("(function(module, exports, require) {" + output + "})", "testcase.js");
		var m = { exports: {}, id: 1 };
		fn(m, m.exports, function(module) {
			if(module === "./lib/css-base.js")
				return require("../lib/css-base");
			if(module.indexOf("-!loader!") === 0)
				module = module.substr(9);
			if(modules && modules[module])
				return modules[module];
			return "{" + module + "}";
		});
	} catch(e) {
		console.error(output);
		throw e;
	}
	delete m.exports.toString;
	delete m.exports.i;
	return m.exports;
}

function assetEvaluated(output, result, modules) {
	var exports = getEvaluated(output, result, modules);
	exports.should.be.eql(result);
}

exports.test = function test(name, input, result, query, modules) {
	it(name, function() {
		var output = cssLoader.call({
			options: {
				context: ""
			},
			loaders: [{request: "loader"}],
			loaderIndex: 0,
			context: "",
			resource: "test.css",
			request: "css-loader!test.css",
			query: query,
			emitError: function(message) {
				throw new Error(message);
			}
		}, input);
		assetEvaluated(output, result, modules);
	});
};

exports.testSingleItem = function testSingleItem(name, input, result, query, modules) {
	it(name, function() {
		var output = cssLoader.call({
			options: {
				context: ""
			},
			loaders: [{request: "loader"}],
			loaderIndex: 0,
			context: "",
			resource: "test.css",
			request: "css-loader!test.css",
			query: query,
			emitError: function(message) {
				throw new Error(message);
			}
		}, input);
		var exports = getEvaluated(output, result, modules);
		Array.isArray(exports).should.be.eql(true);
		(exports.length).should.be.eql(1);
		(exports[0].length).should.be.eql(3);
		(exports[0][0]).should.be.eql(1);
		(exports[0][2]).should.be.eql("");
		(exports[0][1]).should.be.eql(result);
	});
};

exports.testMinimize = function testMinimize(name, input, result, query, modules) {
	it(name, function() {
		var output = cssLoader.call({
			options: {
				context: ""
			},
			loaders: [{request: "loader"}],
			loaderIndex: 0,
			context: "",
			resource: "test.css",
			request: "css-loader!test.css",
			minimize: true,
			query: query,
			emitError: function(message) {
				throw new Error(message);
			}
		}, input);
		assetEvaluated(output, result, modules);
	});
};
