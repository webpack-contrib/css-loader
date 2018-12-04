const vm = require('vm');
const path = require('path');

const del = require('del');
const webpack = require('webpack');
const MemoryFS = require('memory-fs');
const stripAnsi = require('strip-ansi');

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
            'nested-import',
            'postcss-present-env',
            'icss/tests-cases/import',
            'icss/tests-cases/import-reserved-keywords',
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
            'modules/tests-cases/media-2',
          ].map((importedPath) =>
            path.resolve(
              __dirname,
              `./fixtures/${importedPath}`,
              module.replace('aliasesImg/', '')
            )
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
            ]
              .concat(
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
              )
              .concat(
                config.postcssLoader
                  ? [
                      {
                        loader: 'postcss-loader',
                        options: config.postcssLoaderOptions,
                      },
                    ]
                  : []
              )
              .concat(
                config.sassLoader
                  ? [
                      {
                        loader: 'sass-loader',
                        options: config.sassLoaderOptions || {},
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

function compile(fixture, config = {}, options = {}) {
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
    resolve: {
      alias: {
        aliasesImg: path.resolve(__dirname, 'fixtures/url'),
      },
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
}

function normalizeErrors(errors) {
  return errors.map((error) => {
    const message = error.toString();

    return stripAnsi(message)
      .replace(/\(from .*?\)/, '(from `replaced original path`)')
      .replace(/at(.*?)\(.*?\)/g, 'at$1(`replaced original path`)');
  });
}

function normalizeSourceMap(module) {
  return module.map((m) => {
    if (m[3]) {
      // eslint-disable-next-line no-param-reassign
      m[3].sources = m[3].sources.map(() => '/replaced/original/path/');
    }

    return m;
  });
}

module.exports = {
  webpack: compile,
  evaluated,
  normalizeErrors,
  normalizeSourceMap,
};
