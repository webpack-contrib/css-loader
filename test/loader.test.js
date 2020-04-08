import path from 'path';

import { version } from 'webpack';

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

describe('loader', () => {
  it('should work', async () => {
    const compiler = getCompiler('./basic.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./basic.css', stats)).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with empty css', async () => {
    const compiler = getCompiler('./empty.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./empty.css', stats)).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with empty options', async () => {
    const compiler = getCompiler('./basic.js', {});
    const stats = await compile(compiler);

    expect(getModuleSource('./basic.css', stats)).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with "asset" module type', async () => {
    const isWebpack5 = version[0] === '5';
    const config = {
      module: {
        rules: [
          {
            test: /\.css$/i,
            use: [
              {
                loader: path.resolve(__dirname, '../src'),
              },
            ],
          },
          isWebpack5
            ? {
                test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/i,
                type: 'asset',
              }
            : {
                test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/i,
                loader: 'file-loader',
                options: { name: '[name].[ext]' },
              },
        ],
      },
    };

    if (isWebpack5) {
      config.experiments = { asset: true };
      config.output = {
        path: path.resolve(__dirname, 'outputs'),
        filename: '[name].bundle.js',
        chunkFilename: '[name].chunk.js',
        publicPath: '/webpack/public/path/',
        assetModuleFilename: '[name][ext]',
      };
    }

    const compiler = getCompiler('./basic.js', {}, config);
    const stats = await compile(compiler);

    expect(getModuleSource('./basic.css', stats)).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should throws error when no loader(s) for assets', async () => {
    const compiler = getCompiler(
      './basic.js',
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              loader: path.resolve(__dirname, '../src'),
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should throw error on invalid css syntax', async () => {
    const compiler = getCompiler('./invalid.js', {});
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should reuse `ast` from "postcss-loader"', async () => {
    const spy = jest.fn();
    const compiler = getCompiler(
      './postcss-present-env/source.js',
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: { importLoaders: 1 },
                },
                {
                  loader: require.resolve('./helpers/ast-loader'),
                  options: { spy },
                },
              ],
            },
            {
              test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
              loader: 'file-loader',
              options: { name: '[name].[ext]' },
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(spy).toHaveBeenCalledTimes(1);

    expect(
      getModuleSource('./postcss-present-env/source.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with "sass-loader"', async () => {
    const compiler = getCompiler(
      './scss/source.js',
      {},
      {
        module: {
          rules: [
            {
              test: /\.s[ca]ss$/i,
              rules: [
                { loader: path.resolve(__dirname, '../src') },
                {
                  loader: 'sass-loader',
                  options: {
                    // eslint-disable-next-line global-require
                    implementation: require('sass'),
                  },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource('./scss/source.scss', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with ModuleConcatenationPlugin', async () => {
    const compiler = getCompiler(
      './basic.js',
      {},
      {
        mode: 'production',
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: { esModule: true },
                },
              ],
            },
            {
              test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
              loader: 'file-loader',
              options: { name: '[name].[ext]', esModule: true },
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    if (stats.compilation.modules.size) {
      expect(stats.compilation.modules.size).toBe(10);
    } else {
      expect(stats.compilation.modules.length).toBe(6);
    }

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with ModuleConcatenationPlugin (file-loader)', async () => {
    const compiler = getCompiler(
      './basic.js',
      {},
      {
        mode: 'production',
        module: {
          rules: [
            {
              test: /\.css$/i,
              loader: path.resolve(__dirname, '../src'),
            },
            {
              test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
              loader: 'file-loader',
              options: { name: '[name].[ext]', esModule: true },
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    if (stats.compilation.modules.size) {
      expect(stats.compilation.modules.size).toBe(11);
    } else {
      expect(stats.compilation.modules.length).toBe(6);
    }

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with ModuleConcatenationPlugin (url-loader)', async () => {
    const compiler = getCompiler(
      './basic.js',
      {},
      {
        mode: 'production',
        module: {
          rules: [
            {
              test: /\.css$/i,
              loader: path.resolve(__dirname, '../src'),
            },
            {
              test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
              loader: 'url-loader',
              options: { name: '[name].[ext]', limit: true, esModule: true },
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    if (stats.compilation.modules.size) {
      expect(stats.compilation.modules.size).toBe(10);
    } else {
      expect(stats.compilation.modules.length).toBe(6);
    }

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('issue #1033', async () => {
    const compiler = getCompiler('./modules/issue-1033/issue-1033.js', {
      modules: { mode: 'local', localIdentName: '_[local]' },
      onlyLocals: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/issue-1033/issue-1033.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('issue #1033 (2)', async () => {
    const compiler = getCompiler('./modules/issue-1033/issue-1033.js', {
      modules: { mode: 'local', localIdentName: '_[local]' },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/issue-1033/issue-1033.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should throw an error on invisible spaces', async () => {
    const compiler = getCompiler('./invisible-space.js');
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with the "modules.auto" option and the "importLoaders" option', async () => {
    const compiler = getCompiler(
      './integration/index.js',
      {},
      {
        module: {
          rules: [
            {
              test: /\.((c|sa|sc)ss)$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: {
                    // Run only `postcss-loader` on each `@import`
                    // If you need run `sass-loader` and `postcss-loader` please set it to `2`
                    importLoaders: 1,
                    // Automatically enable css modules for files satisfying `/\.module\.\w+$/i` RegExp.
                    modules: { auto: true },
                  },
                },
                {
                  loader: 'postcss-loader',
                  options: { plugins: () => [postcssPresetEnv({ stage: 0 })] },
                },
                // Can be `less-loader`
                // The `test` property should be `\.less/i`
                {
                  test: /\.s[ac]ss$/i,
                  loader: 'sass-loader',
                },
              ],
            },
            {
              test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
              loader: 'url-loader',
              options: {
                limit: 8192,
              },
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should have same "contenthash" with "css-loader" and without source maps', async () => {
    const compiler = getCompiler(
      './contenthash/basic-css.js',
      {},
      {
        output: {
          path: path.resolve(__dirname, '../outputs'),
          filename: '[name].[contenthash].bundle.js',
          chunkFilename: '[name].[contenthash].chunk.js',
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
    const isWebpack5 = version[0] === '5';

    expect(
      stats.compilation.assets[
        isWebpack5
          ? 'main.fd612b1d69f7c1e6ba5f.bundle.js'
          : 'main.7d23eae418a6571797ac.bundle.js'
      ]
    ).toBeDefined();
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should have same "contenthash" with "css-loader" and with source maps', async () => {
    const compiler = getCompiler(
      './contenthash/basic-css.js',
      {},
      {
        output: {
          path: path.resolve(__dirname, '../outputs'),
          filename: '[name].[contenthash].bundle.js',
          chunkFilename: '[name].[contenthash].chunk.js',
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
    const isWebpack5 = version[0] === '5';

    expect(
      stats.compilation.assets[
        isWebpack5
          ? 'main.4e80ca040390d63ea450.bundle.js'
          : 'main.5cb87cbcc122bf7fffd7.bundle.js'
      ]
    ).toBeDefined();
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should have same "contenthash" with "postcss-loader" and without source maps', async () => {
    const compiler = getCompiler(
      './contenthash/basic-postcss.js',
      {},
      {
        output: {
          path: path.resolve(__dirname, '../outputs'),
          filename: '[name].[contenthash].bundle.js',
          chunkFilename: '[name].[contenthash].chunk.js',
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
    const isWebpack5 = version[0] === '5';

    expect(
      stats.compilation.assets[
        isWebpack5
          ? 'main.47a6533d9b651ffbecad.bundle.js'
          : 'main.f5cb4d0dd19d4911e054.bundle.js'
      ]
    ).toBeDefined();
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should have same "contenthash" with "postcss-loader" and with source maps', async () => {
    const compiler = getCompiler(
      './contenthash/basic-postcss.js',
      {},
      {
        output: {
          path: path.resolve(__dirname, '../outputs'),
          filename: '[name].[contenthash].bundle.js',
          chunkFilename: '[name].[contenthash].chunk.js',
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
    const isWebpack5 = version[0] === '5';

    expect(
      stats.compilation.assets[
        isWebpack5
          ? 'main.0a16c4c25cba08ab696a.bundle.js'
          : 'main.6668dc2ef887b6b04748.bundle.js'
      ]
    ).toBeDefined();
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should have same "contenthash" with "sass-loader" and without source maps', async () => {
    const compiler = getCompiler(
      './contenthash/basic-sass.js',
      {},
      {
        output: {
          path: path.resolve(__dirname, '../outputs'),
          filename: '[name].[contenthash].bundle.js',
          chunkFilename: '[name].[contenthash].chunk.js',
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
    const isWebpack5 = version[0] === '5';

    expect(
      stats.compilation.assets[
        isWebpack5
          ? 'main.f3d743a96cdd6e368436.bundle.js'
          : 'main.8a3656011c59a5950f16.bundle.js'
      ]
    ).toBeDefined();
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should have same "contenthash" with "sass-loader" and with source maps', async () => {
    const compiler = getCompiler(
      './contenthash/basic-sass.js',
      {},
      {
        output: {
          path: path.resolve(__dirname, '../outputs'),
          filename: '[name].[contenthash].bundle.js',
          chunkFilename: '[name].[contenthash].chunk.js',
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
    const isWebpack5 = version[0] === '5';

    expect(
      stats.compilation.assets[
        isWebpack5
          ? 'main.021e49d811fb525fefec.bundle.js'
          : 'main.4d3725d232198f3e836e.bundle.js'
      ]
    ).toBeDefined();
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
