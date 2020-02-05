import path from 'path';

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
});
