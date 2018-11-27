const vm = require('vm');
const path = require('path');

const del = require('del');
const webpack = require('webpack');
const MemoryFS = require('memory-fs');
const stripAnsi = require('strip-ansi');

const cssLoader = require('../index.js');
const cssLoaderLocals = require('../locals.js');

function evaluated(output, modules, moduleId = 1) {
  let m;
  try {
    const fn = vm.runInThisContext(
      `(function(module, exports, require) {var __webpack_public_path__ = '/webpack/public/path/';${output}})`,
      'testcase.js'
    );
    m = { exports: {}, id: moduleId };
    fn(m, m.exports, (module) => {
      if (module.indexOf('runtime/api') >= 0) {
        // eslint-disable-next-line global-require
        return require('../lib/runtime/api');
      }
      if (module.indexOf('runtime/escape') >= 0) {
        // eslint-disable-next-line global-require
        return require('../lib/runtime/escape');
      }
      if (/^-!.*?!.*$/.test(module)) {
        // eslint-disable-next-line no-param-reassign
        module = module.replace(/-!(.*)?!/, '');
      }
      if (modules && Array.isArray(modules)) {
        const importedModule = modules.find((el) => {
          const modulePath = el.identifier.split('!').pop();
          const importedPaths = [
            'icss/tests-cases/import',
            'import',
            'import/node_modules',
            'url',
            'url/node_modules',
            'modules/tests-cases/urls',
            'modules/tests-cases/comments',
            'modules/tests-cases/values-3',
            'modules/tests-cases/values-4',
            'modules/tests-cases/values-5',
            'modules/tests-cases/values-6',
            'modules/tests-cases/values-7',
            'modules/tests-cases/composes-1',
            'modules/tests-cases/composes-2',
            'modules/tests-cases/composes-multiple',
            'modules/tests-cases/composes-with-importing',
          ].map((importedPath) =>
            path.resolve(__dirname, `./fixtures/${importedPath}`, module)
          );
          return importedPaths.includes(modulePath);
        });

        if (importedModule) {
          // eslint-disable-next-line no-param-reassign
          moduleId += 1;
          return evaluated(importedModule.source, modules, moduleId);
        }

        return 'nothing';
      } else if (modules && module in modules) {
        // Compatibility with old tests
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
  const exports = evaluated(output, modules);
  expect(exports).toEqual(result);
}

function assertRaw(output, result) {
  expect(output).toContain(result);
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

exports.runLoader = runLoader;

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
        const exports = evaluated(output, modules);
        expect(Array.isArray(exports)).toBe(true);
        expect(exports).toHaveLength(1);
        expect(exports[0].length >= 3).toBe(true);
        expect(exports[0][0]).toBe(1);
        expect(exports[0][2]).toBe('');
        expect(exports[0][1]).toBe(result);
        return done();
      }
    );
  });
};

const moduleConfig = (config) => {
  return {
    rules: config.rules
      ? config.rules
      : [
          {
            test: (config.loader && config.loader.test) || /\.css$/,
            use: [
              {
                loader: path.resolve(__dirname, '../index.js'),
                options: (config.loader && config.loader.options) || {},
              },
            ].concat(
              config.sourceMap
                ? [
                    {
                      loader: path.resolve(
                        __dirname,
                        './fixtures/source-map-loader.js'
                      ),
                      options: {
                        sourceMap: config.sourceMap,
                      },
                    },
                  ]
                : []
            ),
          },
          {
            test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
            use: {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
              },
            },
          },
        ],
  };
};
const pluginsConfig = (config) => [].concat(config.plugins || []);
const outputConfig = (config) => {
  return {
    path: path.resolve(
      __dirname,
      `../outputs/${config.output ? config.output : ''}`
    ),
    filename: '[name].bundle.js',
  };
};

exports.webpack = function compile(fixture, config = {}, options = {}) {
  // webpack Config
  // eslint-disable-next-line no-param-reassign
  config = {
    mode: 'development',
    devtool: config.devtool || 'sourcemap',
    context: path.resolve(__dirname, 'fixtures'),
    entry: path.resolve(__dirname, 'fixtures', fixture),
    output: outputConfig(config),
    module: moduleConfig(config),
    plugins: pluginsConfig(config),
    optimization: {
      runtimeChunk: true,
    },
  };

  // Compiler Options
  // eslint-disable-next-line no-param-reassign
  options = Object.assign({ output: false }, options);

  if (options.output) {
    del.sync(config.output.path);
  }

  const compiler = webpack(config);

  if (!options.output) {
    compiler.outputFileSystem = new MemoryFS();
  }

  return new Promise((resolve, reject) =>
    compiler.run((error, stats) => {
      if (error) {
        return reject(error);
      }
      return resolve(stats);
    })
  );
};

exports.evaluated = evaluated;

function normalizeErrors(errors) {
  return errors.map((error) => {
    const message = error.toString();

    return stripAnsi(message)
      .replace(/\(from .*?\)/, '(from `replaced original path`)')
      .replace(/at(.*?)\(.*?\)/g, 'at$1(`replaced original path`)');
  });
}

exports.normalizeErrors = normalizeErrors;

function normalizeSourceMap(module) {
  return module.map((m) => {
    if (m[3]) {
      // eslint-disable-next-line no-param-reassign
      m[3].sources = m[3].sources.map(() => '/replaced/original/path/');
    }

    return m;
  });
}

exports.normalizeSourceMap = normalizeSourceMap;
