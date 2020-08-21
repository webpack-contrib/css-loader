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

    it('should generate source maps when source maps is valid from an other loader (`sass-loader`)', async () => {
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
