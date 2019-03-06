import vm from 'vm';
import path from 'path';

import del from 'del';
import webpack from 'webpack';
import MemoryFS from 'memory-fs';
import stripAnsi from 'strip-ansi';
import normalizePath from 'normalize-path';

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
        return require('../src/runtime/api');
      }
      if (module.indexOf('runtime/url-escape') >= 0) {
        // eslint-disable-next-line global-require
        return require('../src/runtime/url-escape');
      }
      if (/^-!.*?!.*$/.test(module)) {
        // eslint-disable-next-line no-param-reassign
        module = module.replace(/-!(.*)?!/, '');
      }
      if (modules && Array.isArray(modules)) {
        const importedModule = modules.find((el) => {
          const modulePath = el.identifier.split('!').pop();
          // We need refactor this logic
          const importedPaths = [
            'nested-import',
            'postcss-present-env',
            'icss/tests-cases/import',
            'icss/tests-cases/import-reserved-keywords',
            'import',
            'import/node_modules',
            'url',
            'url/node_modules',
            'modules/',
            'modules/issue-286',
            'modules/issue-636',
            'modules/node_modules',
            'modules/tests-cases/urls',
            'modules/tests-cases/issue-589',
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
              module
                .replace('aliasesImg/', '')
                .replace('aliasesImport/', '')
                .replace('aliasesComposes/', '')
                .replace(/!!(.*)?!/, '')
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
                loader: path.resolve(__dirname, '../src/index.js'),
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
          config.additionalLoader ? config.additionalLoader : {},
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
        aliasesImport: path.resolve(__dirname, 'fixtures/import'),
        aliasesComposes: path.resolve(__dirname, 'fixtures/modules'),
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
      if (m[3].file) {
        // eslint-disable-next-line no-param-reassign
        m[3].file = normalizePath(
          path.relative(path.resolve(__dirname, 'fixtures'), m[3].file)
        );
      }

      if (m[3].sourceRoot) {
        // eslint-disable-next-line no-param-reassign
        m[3].sourceRoot = normalizePath(
          path.relative(path.resolve(__dirname, 'fixtures'), m[3].sourceRoot)
        );
      }

      if (m[3].sources) {
        // eslint-disable-next-line no-param-reassign
        m[3].sources = m[3].sources.map((source) =>
          normalizePath(
            path.relative(path.resolve(__dirname, 'fixtures'), source)
          )
        );
      }
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
