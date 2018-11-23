/* globals it */

require('should');
const vm = require('vm');

const cssLoader = require('../index.js');
const cssLoaderLocals = require('../locals.js');

function getEvaluated(output, modules) {
  let m;
  try {
    const fn = vm.runInThisContext(
      `(function(module, exports, require) {${output}})`,
      'testcase.js'
    );
    m = { exports: {}, id: 1 };
    fn(m, m.exports, (module) => {
      if (module.indexOf('css-base') >= 0) {
        // eslint-disable-next-line global-require
        return require('../lib/css-base');
      }
      if (module.indexOf('url/escape') >= 0) {
        // eslint-disable-next-line global-require
        return require('../lib/url/escape');
      }
      if (module.indexOf('-!/path/css-loader!') === 0) {
        // eslint-disable-next-line no-param-reassign
        module = module.substr(19);
      }
      if (modules && module in modules) {
        return modules[module];
      }
      return `{${module}}`;
    });
  } catch (e) {
    console.error(output); // eslint-disable-line no-console
    throw e;
  }
  delete m.exports.toString;
  delete m.exports.i;
  return m.exports;
}

function assetEvaluated(output, result, modules) {
  const exports = getEvaluated(output, modules);
  exports.should.be.eql(result);
}

function assertRaw(output, result) {
  output.should.containEql(result);
}

function runLoader(loader, input, map, addOptions, callback) {
  const opt = {
    options: {
      context: '',
    },
    callback,
    async() {
      return callback;
    },
    loaders: [{ request: '/path/css-loader' }],
    loaderIndex: 0,
    context: '',
    resource: 'test.css',
    resourcePath: 'test.css',
    request: 'css-loader!test.css',
    emitError(message) {
      throw new Error(message);
    },
  };
  Object.keys(addOptions).forEach((key) => {
    opt[key] = addOptions[key];
  });
  loader.call(opt, input, map);
}

exports.test = function test(name, input, result, query, modules) {
  it(name, (done) => {
    runLoader(
      cssLoader,
      input,
      null,
      !query || typeof query === 'string'
        ? {
            query,
          }
        : query,
      (err, output) => {
        if (err) {
          return done(err);
        }
        assetEvaluated(output, result, modules);
        return done();
      }
    );
  });
};

exports.testRaw = function testRaw(name, input, result, query) {
  it(name, (done) => {
    runLoader(
      cssLoader,
      input,
      null,
      !query || typeof query === 'string'
        ? {
            query,
          }
        : query,
      (err, output) => {
        if (err) {
          return done(err);
        }
        assertRaw(output, result);
        return done();
      }
    );
  });
};

exports.testError = function test(name, input, onError) {
  it(name, (done) => {
    runLoader(cssLoader, input, null, {}, (err) => {
      // eslint-disable-line no-unused-vars
      if (!err) {
        return done(new Error('Expected error to be thrown'));
      }
      try {
        onError(err);
      } catch (error) {
        return done(error);
      }
      return done();
    });
  });
};

exports.testWithMap = function test(name, input, map, result, query, modules) {
  it(name, (done) => {
    runLoader(
      cssLoader,
      input,
      map,
      {
        query,
      },
      (err, output) => {
        if (err) {
          return done(err);
        }
        assetEvaluated(output, result, modules);
        return done();
      }
    );
  });
};

exports.testMap = function test(name, input, map, addOptions, result, modules) {
  it(name, (done) => {
    runLoader(cssLoader, input, map, addOptions, (err, output) => {
      if (err) {
        return done(err);
      }
      assetEvaluated(output, result, modules);
      return done();
    });
  });
};

exports.testLocals = function testLocals(name, input, result, query, modules) {
  it(name, (done) => {
    runLoader(
      cssLoaderLocals,
      input,
      null,
      {
        query,
      },
      (err, output) => {
        if (err) {
          return done(err);
        }
        assetEvaluated(output, result, modules);
        return done();
      }
    );
  });
};

exports.testSingleItem = function testSingleItem(
  name,
  input,
  result,
  query,
  modules
) {
  it(name, (done) => {
    runLoader(
      cssLoader,
      input,
      null,
      {
        query,
      },
      (err, output) => {
        if (err) {
          return done(err);
        }
        const exports = getEvaluated(output, modules);
        Array.isArray(exports).should.be.eql(true);
        exports.length.should.be.eql(1);
        (exports[0].length >= 3).should.be.eql(true);
        exports[0][0].should.be.eql(1);
        exports[0][2].should.be.eql('');
        exports[0][1].should.be.eql(result);
        return done();
      }
    );
  });
};
