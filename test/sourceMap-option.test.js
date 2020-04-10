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

const MiniCssExtractPlugin = require('mini-css-extract-plugin');

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

    // TODO uncomment when `sass-loader` will always right source maps
    // it('should generate source maps when source maps is valid from an other loader (`sass-loader`)', async () => {
    //   const compiler = getCompiler(
    //     './source-map/basic-scss.js',
    //     {},
    //     {
    //       module: {
    //         rules: [
    //           {
    //             test: /\.s[ca]ss$/i,
    //             use: [
    //               {
    //                 loader: path.resolve(__dirname, '../src'),
    //                 options: {
    //                   sourceMap: true,
    //                 },
    //               },
    //               {
    //                 loader: 'sass-loader',
    //                 options: {
    //                   // eslint-disable-next-line global-require
    //                   implementation: require('sass'),
    //                   sourceMap: true,
    //                 },
    //               },
    //             ],
    //           },
    //         ],
    //       },
    //     }
    //   );
    //   const stats = await compile(compiler);
    //
    //   expect(getModuleSource('./source-map/basic.scss', stats)).toMatchSnapshot('module');
    //   expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
    //     'result'
    //   );
    //   expect(getWarnings(stats)).toMatchSnapshot('warnings');
    //   expect(getErrors(stats)).toMatchSnapshot('errors');
    // });
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

  it('should use forward slash in url with "css-loader" and without source maps', async () => {
    const compiler = getCompiler(
      './source-map/basic.js',
      {},
      {
        output: {
          path: path.resolve(__dirname, '../outputs'),
          filename: '[name].bundle.js',
          chunkFilename: '[name].chunk.js',
          publicPath: '/webpack/public/path/',
        },
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: { sourceMap: false },
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
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should use forward slash in url with "css-loader" and with source maps', async () => {
    const compiler = getCompiler(
      './source-map/basic.js',
      {},
      {
        output: {
          path: path.resolve(__dirname, '../outputs'),
          filename: '[name].bundle.js',
          chunkFilename: '[name].chunk.js',
          publicPath: '/webpack/public/path/',
        },
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: { sourceMap: true },
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
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should use forward slash in url with "postcss-loader" and without source maps', async () => {
    const compiler = getCompiler(
      './source-map/basic-postcss.js',
      {},
      {
        output: {
          path: path.resolve(__dirname, '../outputs'),
          filename: '[name].bundle.js',
          chunkFilename: '[name].chunk.js',
          publicPath: '/webpack/public/path/',
        },
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: {
                    sourceMap: false,
                    importLoaders: 1,
                  },
                },
                {
                  loader: 'postcss-loader',
                  options: {
                    plugins: () => [postcssPresetEnv({ stage: 0 })],
                    sourceMap: false,
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
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should use forward slash in url with "postcss-loader" and with source maps', async () => {
    const compiler = getCompiler(
      './source-map/basic-postcss.js',
      {},
      {
        output: {
          path: path.resolve(__dirname, '../outputs'),
          filename: '[name].bundle.js',
          chunkFilename: '[name].chunk.js',
          publicPath: '/webpack/public/path/',
        },
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
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
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should use forward slash in url with "sass-loader" and without source maps', async () => {
    const compiler = getCompiler(
      './source-map/basic-scss.js',
      {},
      {
        output: {
          path: path.resolve(__dirname, '../outputs'),
          filename: '[name].bundle.js',
          chunkFilename: '[name].chunk.js',
          publicPath: '/webpack/public/path/',
        },
        module: {
          rules: [
            {
              test: /\.s[ca]ss$/i,
              rules: [
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
                    sourceMap: false,
                  },
                },
                {
                  loader: 'sass-loader',
                  options: {
                    // eslint-disable-next-line global-require
                    implementation: require('sass'),
                    sourceMap: false,
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
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should use forward slash in url with "sass-loader" and with source maps', async () => {
    const compiler = getCompiler(
      './source-map/basic-scss.js',
      {},
      {
        output: {
          path: path.resolve(__dirname, '../outputs'),
          filename: '[name].bundle.js',
          chunkFilename: '[name].chunk.js',
          publicPath: '/webpack/public/path/',
        },
        module: {
          rules: [
            {
              test: /\.s[ca]ss$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: {
                    sourceMap: true,
                    importLoaders: 1,
                  },
                },
                {
                  loader: 'postcss-loader',
                  options: {
                    plugins: () => [postcssPresetEnv({ stage: 0 })],
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
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should use forward slash in url with "css-loader", source maps and MiniCssExtractPlugin', async () => {
    const compiler = getCompiler(
      './source-map/basic.js',
      {},
      {
        devtool: 'source-map',
        output: {
          path: path.resolve(__dirname, '../outputs'),
          filename: '[name].bundle.js',
          chunkFilename: '[name].chunk.js',
          publicPath: '/webpack/public/path/',
        },
        plugins: [
          new MiniCssExtractPlugin({
            filename: '[name].css',
          }),
        ],
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: MiniCssExtractPlugin.loader,
                },
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: { sourceMap: true },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(stats.compilation.assets).toMatchSnapshot('module');
    expect(getModuleSource('./source-map/basic.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should use forward slash in url with "sass-loader", source maps and MiniCssExtractPlugin', async () => {
    const compiler = getCompiler(
      './source-map/basic-scss.js',
      {},
      {
        devtool: 'source-map',
        output: {
          path: path.resolve(__dirname, '../outputs'),
          filename: '[name].bundle.js',
          chunkFilename: '[name].chunk.js',
          publicPath: '/webpack/public/path/',
        },
        plugins: [
          new MiniCssExtractPlugin({
            filename: '[name].css',
          }),
        ],
        module: {
          rules: [
            {
              test: /\.s[ca]ss$/i,
              rules: [
                {
                  loader: MiniCssExtractPlugin.loader,
                },
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: {
                    sourceMap: true,
                    importLoaders: 1,
                  },
                },
                {
                  loader: 'postcss-loader',
                  options: {
                    plugins: () => [postcssPresetEnv({ stage: 0 })],
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

    expect(stats.compilation.assets).toMatchSnapshot('module');
    expect(getModuleSource('./source-map/basic.scss', stats)).toMatchSnapshot(
      'module'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should use forward slash in url with "postcss-loader", source maps and MiniCssExtractPlugin', async () => {
    const compiler = getCompiler(
      './source-map/basic-postcss.js',
      {},
      {
        devtool: 'source-map',
        output: {
          path: path.resolve(__dirname, '../outputs'),
          filename: '[name].bundle.js',
          chunkFilename: '[name].chunk.js',
          publicPath: '/webpack/public/path/',
        },
        plugins: [
          new MiniCssExtractPlugin({
            filename: '[name].css',
          }),
        ],
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: MiniCssExtractPlugin.loader,
                },
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: {
                    sourceMap: true,
                    importLoaders: 1,
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

    expect(stats.compilation.assets).toMatchSnapshot('module');
    expect(
      getModuleSource('./source-map/basic.postcss.css', stats)
    ).toMatchSnapshot('module');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
