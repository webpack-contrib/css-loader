/*globals it */

require("should");
var cssLoader = require("../index.js");
var cssLoaderLocals = require("../locals.js");
var vm = require("vm");
var sinon = require("sinon");

function getEvaluated(output, modules) {
	try {
		var fn = vm.runInThisContext("(function(module, exports, require) {" + output + "})", "testcase.js");
		var m = { exports: {}, id: 1 };
		fn(m, m.exports, function(module) {
			if(module.indexOf("css-base") >= 0)
				return require("../lib/css-base");
			if(module.indexOf("url/escape") >= 0)
				return require("../lib/url/escape");
			if(module.indexOf("-!/path/css-loader!") === 0)
				module = module.substr(19);
			if(modules && module in modules)
				return modules[module];
			return "{" + module + "}";
		});
	} catch(e) {
		console.error(output); // eslint-disable-line no-console
		throw e;
	}
	delete m.exports.toString;
	delete m.exports.i;
	return m.exports;
}

function assetEvaluated(output, result, modules) {
	var exports = getEvaluated(output, modules);
	exports.should.be.eql(result);
}

function assertRaw(output, result) {
	output.should.containEql(result);
}

function runLoader(loader, input, map, addOptions, callback) {
	var opt = {
		options: {
			context: ""
		},
		callback: callback,
		async: function() {
			return callback;
		},
		loaders: [{request: "/path/css-loader"}],
		loaderIndex: 0,
		context: "",
		resource: "test.css",
		resourcePath: "test.css",
		request: "css-loader!test.css",
		emitError: function(message) {
			throw new Error(message);
		}
	};
	Object.keys(addOptions).forEach(function(key) {
		opt[key] = addOptions[key];
	});
	loader.call(opt, input, map);
}

exports.test = function test(name, input, result, query, modules) {
	it(name, function(done) {
		runLoader(cssLoader, input, undefined, !query || typeof query === "string" ? {
			query: query
		} : query, function(err, output) {
			if(err) return done(err);
			assetEvaluated(output, result, modules);
			done();
		});
	});
};

exports.testRaw = function testRaw(name, input, result, query) {
	it(name, function(done) {
		runLoader(cssLoader, input, undefined, !query || typeof query === "string" ? {
			query: query
		} : query, function(err, output) {
			if(err) return done(err);
			assertRaw(output, result);
			done();
		});
	});
}

exports.testError = function test(name, input, onError) {
	it(name, function(done) {
    runLoader(cssLoader, input, undefined, {}, function(err, output) { // eslint-disable-line no-unused-vars
      if (!err) {
        done(new Error('Expected error to be thrown'));
      } else {
        try {
          onError(err);
        } catch (error) {
          return done(error);
        }
        done();
      }
		});
	});
};

exports.testWithMap = function test(name, input, map, result, query, modules) {
	it(name, function(done) {
		runLoader(cssLoader, input, map, {
			query: query
		}, function(err, output) {
			if(err) return done(err);
			assetEvaluated(output, result, modules);
			done();
		});
	});
};

exports.testMap = function test(name, input, map, addOptions, result, modules) {
	it(name, function(done) {
		runLoader(cssLoader, input, map, addOptions, function(err, output) {
			if(err) return done(err);
			assetEvaluated(output, result, modules);
			done();
		});
	});
};

exports.testLocals = function testLocals(name, input, result, query, modules) {
	it(name, function(done) {
		runLoader(cssLoaderLocals, input, undefined, {
			query: query
		}, function(err, output) {
			if(err) return done(err);
			assetEvaluated(output, result, modules);
			done();
		});
	});
};

exports.testSingleItem = function testSingleItem(name, input, result, query, modules) {
	it(name, function(done) {
		runLoader(cssLoader, input, undefined, {
			query: query
		}, function(err, output) {
			if(err) return done(err);
			var exports = getEvaluated(output, modules);
			Array.isArray(exports).should.be.eql(true);
			(exports.length).should.be.eql(1);
			(exports[0].length >= 3).should.be.eql(true);
			(exports[0][0]).should.be.eql(1);
			(exports[0][2]).should.be.eql("");
			(exports[0][1]).should.be.eql(result);
			done();
		});
	});
};

exports.testMinimize = function testMinimize(name, input, result, query, modules) {
	it(name, function(done) {
		runLoader(cssLoader, input, undefined, {
			minimize: true,
			query: query
		}, function(err, output) {
			if(err) return done(err);
			assetEvaluated(output, result, modules);
			done();
		});
	});
};

exports.testResultHook = function testResultHook(name, loader) {
	it(name, function(done) {
		var source = "div { color: red; }";
		var resultHook = sinon.spy();
		runLoader(loader, source, undefined, {
			query: { resultHook: resultHook }
		}, function(err) {
			if(err) return done(err);
			resultHook.called.should.be.eql(true);
			var hookArgs = resultHook.args[0];
			hookArgs[0].request.should.be.eql("css-loader!test.css");
			hookArgs[1].source.should.be.eql(source);
			done();
		});
	});
}
