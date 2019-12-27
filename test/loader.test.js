import path from 'path';

import postcssPresetEnv from 'postcss-preset-env';

import { version } from 'webpack';

import {
  compile,
  getCompiler,
  getErrors,
  getExecutedCode,
  getModuleSource,
  getWarnings,
} from './helpers/index';

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
                  loader: 'postcss-loader',
                  options: { plugins: () => [postcssPresetEnv({ stage: 0 })] },
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
          : 'main.b38d5f87c88c55a4258e.bundle.js'
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
          : 'main.54b9712c1981e48c12c4.bundle.js'
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
          : 'main.f8e62206a43c13393798.bundle.js'
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
          : 'main.d77dd6564bc6e6297cd4.bundle.js'
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
          : 'main.9ae036ace8bbbebbd185.bundle.js'
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
          : 'main.a12ab765493c74c80be2.bundle.js'
      ]
    ).toBeDefined();
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
