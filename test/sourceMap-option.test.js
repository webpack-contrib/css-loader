import path from 'path';

import postcssPresetEnv from 'postcss-preset-env';

import {
  compile,
  getCompiler,
  getErrors,
  getExecutedCode,
  getModuleSource,
  getWarnings,
} from './helpers/index';

jest.setTimeout(10000);

describe('"sourceMap" option', () => {
  describe('not specified', () => {
    it('should not generate source maps', async () => {
      const compiler = getCompiler('./source-map/basic.js');
      const stats = await compile(compiler);

      expect(getModuleSource('./source-map/basic.css', stats)).toMatchSnapshot(
        'module'
      );
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });
  });

  describe('true', () => {
    it('should generate source maps', async () => {
      const compiler = getCompiler('./source-map/basic.js', {
        sourceMap: true,
      });
      const stats = await compile(compiler);

      expect(getModuleSource('./source-map/basic.css', stats)).toMatchSnapshot(
        'module'
      );
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it('should generate source maps #2', async () => {
      const compiler = getCompiler('./source-map/with-query.js', {
        sourceMap: true,
      });
      const stats = await compile(compiler);

      expect(
        getModuleSource('./source-map/with-query.css?url=false', stats)
      ).toMatchSnapshot('module');
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it('should generate source maps when source maps equal to "null" from an other loader', async () => {
      const compiler = getCompiler(
        './source-map/basic.js',
        {},
        {
          module: {
            rules: [
              {
                test: /\.css$/i,
                use: [
                  {
                    loader: path.resolve(__dirname, '../src'),
                    options: { sourceMap: true },
                  },
                  {
                    loader: path.resolve(
                      __dirname,
                      './fixtures/source-map-loader.js'
                    ),
                    options: {
                      sourceMap: null,
                    },
                  },
                ],
              },
            ],
          },
        }
      );
      const stats = await compile(compiler);

      expect(getModuleSource('./source-map/basic.css', stats)).toMatchSnapshot(
        'module'
      );
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it('should generate source maps when source maps equal to "undefined" from an other loader', async () => {
      const compiler = getCompiler(
        './source-map/basic.js',
        {},
        {
          module: {
            rules: [
              {
                test: /\.css$/i,
                use: [
                  {
                    loader: path.resolve(__dirname, '../src'),
                    options: { sourceMap: true },
                  },
                  {
                    loader: path.resolve(
                      __dirname,
                      './fixtures/source-map-loader.js'
                    ),
                    options: {
                      // eslint-disable-next-line no-undefined
                      sourceMap: undefined,
                    },
                  },
                ],
              },
            ],
          },
        }
      );
      const stats = await compile(compiler);

      expect(getModuleSource('./source-map/basic.css', stats)).toMatchSnapshot(
        'module'
      );
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it('should generate source maps when source maps is valid and string from an other loader', async () => {
      const absolutePath = path.resolve(
        __dirname,
        'fixtures',
        'source-map',
        'basic.css'
      );

      const compiler = getCompiler(
        './source-map/basic.js',
        {},
        {
          module: {
            rules: [
              {
                test: /\.css$/i,
                use: [
                  {
                    loader: path.resolve(__dirname, '../src'),
                    options: { sourceMap: true },
                  },
                  {
                    loader: path.resolve(
                      __dirname,
                      './fixtures/source-map-loader.js'
                    ),
                    options: {
                      sourceMap: JSON.stringify({
                        version: 3,
                        sources: [absolutePath],
                        names: [],
                        mappings: 'AAAA,6BAA6B;;AAE7B;EACE,UAAU;AACZ',
                        file: absolutePath,
                        sourcesContent: [
                          '@import "./nested/nested.css";\n\n.class {\n  color: red;\n}\n',
                        ],
                      }),
                    },
                  },
                ],
              },
            ],
          },
        }
      );
      const stats = await compile(compiler);

      expect(getModuleSource('./source-map/basic.css', stats)).toMatchSnapshot(
        'module'
      );
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it('should generate source maps when source maps is valid and is set sourceRoot', async () => {
      const absoluteSourceRoot = path.resolve(
        __dirname,
        'fixtures',
        'source-map'
      );
      const compiler = getCompiler(
        './source-map/basic.js',
        {},
        {
          module: {
            rules: [
              {
                test: /\.css$/i,
                use: [
                  {
                    loader: path.resolve(__dirname, '../src'),
                    options: { sourceMap: true },
                  },
                  {
                    loader: path.resolve(
                      __dirname,
                      './fixtures/source-map-loader.js'
                    ),
                    options: {
                      sourceMap: JSON.stringify({
                        foo: 'bar',
                        version: 3,
                        sources: ['basic.css'],
                        sourceRoot: absoluteSourceRoot,
                        names: [],
                        mappings: 'AAAA,6BAA6B;;AAE7B;EACE,UAAU;AACZ',
                        file: 'basic.css',
                        sourcesContent: [
                          '@import "./nested/nested.css";\n\n.class {\n  color: red;\n}\n',
                        ],
                      }),
                    },
                  },
                ],
              },
            ],
          },
        }
      );
      const stats = await compile(compiler);

      expect(getModuleSource('./source-map/basic.css', stats)).toMatchSnapshot(
        'module'
      );
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it('should generate source maps when source maps is valid from an other loader (`postcss-loader`)', async () => {
      const compiler = getCompiler(
        './source-map/basic-postcss.js',
        {},
        {
          module: {
            rules: [
              {
                test: /\.css$/i,
                use: [
                  {
                    loader: path.resolve(__dirname, '../src'),
                    options: {
                      sourceMap: true,
                    },
                  },
                  {
                    loader: 'postcss-loader',
                    options: {
                      plugins: () => [postcssPresetEnv({ stage: 0 })],
                      sourceMap: true,
                    },
                  },
                ],
              },
            ],
          },
        }
      );
      const stats = await compile(compiler);

      expect(
        getModuleSource('./source-map/basic.postcss.css', stats)
      ).toMatchSnapshot('module');
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it.only('should generate source maps when source maps is valid from an other loader (`sass-loader`)', async () => {
      require('fs').writeFileSync(
        path.resolve(__dirname, '../node_modules/sass-loader/dist/index.js'),
        `
        "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

var _schemaUtils = _interopRequireDefault(require("schema-utils"));

var _loaderUtils = require("loader-utils");

var _options = _interopRequireDefault(require("./options.json"));

var _utils = require("./utils");

var _SassError = _interopRequireDefault(require("./SassError"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The sass-loader makes node-sass and dart-sass available to webpack modules.
 *
 * @this {object}
 * @param {string} content
 */
function loader(content) {
  const options = (0, _loaderUtils.getOptions)(this);
  (0, _schemaUtils.default)(_options.default, options, {
    name: 'Sass Loader',
    baseDataPath: 'options'
  });
  const implementation = (0, _utils.getSassImplementation)(options.implementation);
  const sassOptions = (0, _utils.getSassOptions)(this, options, content, implementation);
  const shouldUseWebpackImporter = typeof options.webpackImporter === 'boolean' ? options.webpackImporter : true;

  if (shouldUseWebpackImporter) {
    const {
      includePaths
    } = sassOptions;
    sassOptions.importer.push((0, _utils.getWebpackImporter)(this, implementation, includePaths));
  }

  const callback = this.async();
  const render = (0, _utils.getRenderFunctionFromSassImplementation)(implementation);

  console.log(sassOptions);

  delete sassOptions.sourceMap;
  delete sassOptions.sourceMapRoot;

  sassOptions.outFile = _path.default.resolve(this.rootContext, 'file.css');
  sassOptions.sourceMap = true;
  sassOptions.sourceMapRoot = this.rootContext;

  console.log(sassOptions);

  render(sassOptions, (error, result) => {
    if (error) {
      // There are situations when the \`file\` property do not exist
      if (error.file) {
        // \`node-sass\` returns POSIX paths
        this.addDependency(_path.default.normalize(error.file));
      }

      callback(new _SassError.default(error));
      return;
    }

    if (result.map) {
      console.log(result.map.toString())
      // eslint-disable-next-line no-param-reassign
      result.map = JSON.parse(result.map); // result.map.file is an optional property that provides the output filename.
      // Since we don't know the final filename in the webpack build chain yet, it makes no sense to have it.
      // eslint-disable-next-line no-param-reassign

      delete result.map.file; // node-sass returns POSIX paths, that's why we need to transform them back to native paths.
      // This fixes an error on windows where the source-map module cannot resolve the source maps.
      // @see https://github.com/webpack-contrib/sass-loader/issues/366#issuecomment-279460722
      // eslint-disable-next-line no-param-reassign

      result.map.sourceRoot = _path.default.normalize(result.map.sourceRoot); // eslint-disable-next-line no-param-reassign

      result.map.sources = result.map.sources.map(_path.default.normalize);
    }

    result.stats.includedFiles.forEach(includedFile => {
      this.addDependency(_path.default.normalize(includedFile));
    });
    callback(null, result.css.toString(), result.map);
  });
}

var _default = loader;
exports.default = _default;
        `
      );

      const compiler = getCompiler(
        './source-map/basic-scss.js',
        {},
        {
          module: {
            rules: [
              {
                test: /\.s[ca]ss$/i,
                use: [
                  {
                    loader: path.resolve(__dirname, '../src'),
                    options: {
                      sourceMap: true,
                    },
                  },
                  {
                    loader: 'sass-loader',
                    options: {
                      // eslint-disable-next-line global-require
                      implementation: require('sass'),
                      sourceMap: true,
                    },
                  },
                ],
              },
            ],
          },
        }
      );
      const stats = await compile(compiler);

      expect(getModuleSource('./source-map/basic.scss', stats)).toMatchSnapshot(
        'module'
      );
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it('should generate source maps when source maps is valid from an other loader (`less-loader`)', async () => {
      const compiler = getCompiler(
        './source-map/basic-less.js',
        {},
        {
          module: {
            rules: [
              {
                test: /\.less$/i,
                use: [
                  {
                    loader: path.resolve(__dirname, '../src'),
                    options: {
                      sourceMap: true,
                    },
                  },
                  {
                    loader: 'less-loader',
                    options: {
                      sourceMap: true,
                    },
                  },
                ],
              },
            ],
          },
        }
      );
      const stats = await compile(compiler);

      expect(getModuleSource('./source-map/base.less', stats)).toMatchSnapshot(
        'module'
      );
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it('should generate source maps when source maps is valid from an other loader (`stylus-loader`)', async () => {
      const compiler = getCompiler(
        './source-map/basic-styl.js',
        {},
        {
          module: {
            rules: [
              {
                test: /\.styl$/i,
                use: [
                  {
                    loader: path.resolve(__dirname, '../src'),
                    options: {
                      sourceMap: true,
                    },
                  },
                  {
                    loader: 'stylus-loader',
                    options: {
                      sourceMap: true,
                    },
                  },
                ],
              },
            ],
          },
        }
      );
      const stats = await compile(compiler);

      expect(getModuleSource('./source-map/base.styl', stats)).toMatchSnapshot(
        'module'
      );
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });
  });

  describe('false', () => {
    it('should not generate source maps', async () => {
      const compiler = getCompiler('./source-map/basic.js', {
        sourceMap: false,
      });
      const stats = await compile(compiler);

      expect(getModuleSource('./source-map/basic.css', stats)).toMatchSnapshot(
        'module'
      );
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it('should not generate source maps when source maps equal to "null" from an other loader', async () => {
      const compiler = getCompiler(
        './source-map/basic.js',
        {},
        {
          module: {
            rules: [
              {
                test: /\.css$/i,
                use: [
                  {
                    loader: path.resolve(__dirname, '../src'),
                    options: { sourceMap: false },
                  },
                  {
                    loader: path.resolve(
                      __dirname,
                      './fixtures/source-map-loader.js'
                    ),
                    options: {
                      sourceMap: null,
                    },
                  },
                ],
              },
            ],
          },
        }
      );
      const stats = await compile(compiler);

      expect(getModuleSource('./source-map/basic.css', stats)).toMatchSnapshot(
        'module'
      );
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it('should not generate source maps when source maps equal to "undefined" from an other loader', async () => {
      const compiler = getCompiler(
        './source-map/basic.js',
        {},
        {
          module: {
            rules: [
              {
                test: /\.css$/i,
                use: [
                  {
                    loader: path.resolve(__dirname, '../src'),
                    options: { sourceMap: false },
                  },
                  {
                    loader: path.resolve(
                      __dirname,
                      './fixtures/source-map-loader.js'
                    ),
                    options: {
                      // eslint-disable-next-line no-undefined
                      sourceMap: undefined,
                    },
                  },
                ],
              },
            ],
          },
        }
      );
      const stats = await compile(compiler);

      expect(getModuleSource('./source-map/basic.css', stats)).toMatchSnapshot(
        'module'
      );
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it('should not generate source maps when source maps is valid and string from an other loader', async () => {
      const compiler = getCompiler(
        './source-map/basic.js',
        {},
        {
          module: {
            rules: [
              {
                test: /\.css$/i,
                use: [
                  {
                    loader: path.resolve(__dirname, '../src'),
                    options: { sourceMap: false },
                  },
                  {
                    loader: path.resolve(
                      __dirname,
                      './fixtures/source-map-loader.js'
                    ),
                    options: {
                      sourceMap: JSON.stringify({
                        foo: 'bar',
                        version: 3,
                        sources: ['basic.css'],
                        names: [],
                        mappings: 'AAAA;EACE,UAAU;AACZ',
                        file: 'basic.css',
                        sourcesContent: ['.class {\n  color: red;\n}\n'],
                      }),
                    },
                  },
                ],
              },
            ],
          },
        }
      );
      const stats = await compile(compiler);

      expect(getModuleSource('./source-map/basic.css', stats)).toMatchSnapshot(
        'module'
      );
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it('should not generate source maps when source maps is valid from an other loader (`postcss-loader`)', async () => {
      const compiler = getCompiler(
        './source-map/basic-postcss.js',
        {},
        {
          module: {
            rules: [
              {
                test: /\.css$/i,
                use: [
                  {
                    loader: path.resolve(__dirname, '../src'),
                    options: {
                      sourceMap: false,
                    },
                  },
                  {
                    loader: 'postcss-loader',
                    options: {
                      plugins: () => [postcssPresetEnv({ stage: 0 })],
                    },
                  },
                ],
              },
            ],
          },
        }
      );
      const stats = await compile(compiler);

      expect(
        getModuleSource('./source-map/basic.postcss.css', stats)
      ).toMatchSnapshot('module');
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it('should not generate source maps when source maps is valid from an other loader (`sass-loader`)', async () => {
      const compiler = getCompiler(
        './source-map/basic-scss.js',
        {},
        {
          module: {
            rules: [
              {
                test: /\.s[ca]ss$/i,
                use: [
                  {
                    loader: path.resolve(__dirname, '../src'),
                    options: {
                      sourceMap: false,
                    },
                  },
                  {
                    loader: 'sass-loader',
                    options: {
                      // eslint-disable-next-line global-require
                      implementation: require('sass'),
                      sourceMap: true,
                    },
                  },
                ],
              },
            ],
          },
        }
      );
      const stats = await compile(compiler);

      expect(getModuleSource('./source-map/basic.scss', stats)).toMatchSnapshot(
        'module'
      );
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });
  });
});
