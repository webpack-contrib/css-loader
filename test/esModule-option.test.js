import path from 'path';

import MiniCssExtractPlugin from 'mini-css-extract-plugin';

import {
  compile,
  getCompiler,
  getErrors,
  getExecutedCode,
  getModuleSource,
  getWarnings,
  readAsset,
} from './helpers/index';

describe('"esModule" option', () => {
  it('should work when not specified', async () => {
    const compiler = getCompiler('./es-module/source.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./es-module/source.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "true"', async () => {
    const compiler = getCompiler('./es-module/source.js', { esModule: true });
    const stats = await compile(compiler);

    expect(getModuleSource('./es-module/source.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "true" and the "mode" value equal to "local"', async () => {
    const compiler = getCompiler('./es-module/source.js', {
      esModule: true,
      modules: 'local',
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./es-module/source.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "true" and the "mode" value equal to "global"', async () => {
    const compiler = getCompiler('./es-module/source.js', {
      esModule: true,
      modules: 'global',
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./es-module/source.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "true" and the "mode" value equal to "pure"', async () => {
    const compiler = getCompiler('./es-module/source.js', {
      esModule: true,
      modules: 'pure',
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./es-module/source.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "false"', async () => {
    const compiler = getCompiler('./es-module/source.js', { esModule: false });
    const stats = await compile(compiler);

    expect(getModuleSource('./es-module/source.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with "namedExport" option', async () => {
    const compiler = getCompiler('./es-module/named/base/index.js', {
      esModule: true,
      modules: {
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./es-module/named/base/index.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with "namedExport" option with nested import', async () => {
    const compiler = getCompiler('./es-module/named/nested/index.js', {
      esModule: true,
      modules: {
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./es-module/named/nested/index.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work js template with "namedExport" option', async () => {
    const compiler = getCompiler('./es-module/named/template/index.js', {
      esModule: true,
      modules: {
        localIdentName: '[local]',
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./es-module/named/template/index.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  const styleLoaderTests = [
    {
      localLoaderMode: 'commonjs',
      extractLoaderMode: 'commonjs',
    },
    {
      localLoaderMode: 'esModule',
      extractLoaderMode: 'esModule',
    },
    {
      localLoaderMode: 'commonjs',
      extractLoaderMode: 'esModule',
    },
    {
      localLoaderMode: 'esModule',
      extractLoaderMode: 'commonjs',
    },
  ];

  for (const test of styleLoaderTests) {
    it(`should work with ${test.localLoaderMode} css-loader + ${test.extractLoaderMode} style-loader`, async () => {
      const compiler = getCompiler(
        './es-module/template/index.js',
        {},
        {
          output: {
            path: path.resolve(__dirname, './outputs'),
            filename: '[name].bundle.js',
            chunkFilename: '[name].chunk.js',
            publicPath: '/webpack/public/path/',
            libraryTarget: 'commonjs2',
          },
          module: {
            rules: [
              {
                test: /\.css$/i,
                use: [
                  {
                    loader: 'style-loader',
                    options: {
                      esModule: test.extractLoaderMode === 'esModule',
                    },
                  },
                  {
                    loader: path.resolve(__dirname, '../src'),
                    options: {
                      esModule: test.localLoaderMode === 'esModule',
                      modules: true,
                    },
                  },
                ],
              },
            ],
          },
        }
      );
      const stats = await compile(compiler);

      // eslint-disable-next-line no-eval
      const result = eval(readAsset('main.bundle.js', compiler, stats));

      expect(result.default || result).toMatchSnapshot('result');

      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });
  }

  const miniCssExtractPluginTests = [
    {
      localLoaderMode: 'commonjs',
      extractLoaderMode: 'commonjs',
    },
    {
      localLoaderMode: 'esModule',
      extractLoaderMode: 'esModule',
    },
    {
      localLoaderMode: 'commonjs',
      extractLoaderMode: 'esModule',
    },
    {
      localLoaderMode: 'esModule',
      extractLoaderMode: 'commonjs',
    },
  ];

  for (const test of miniCssExtractPluginTests) {
    it(`should work with ${test.localLoaderMode} css-loader + ${test.extractLoaderMode} mini-css-extract-plugin`, async () => {
      const compiler = getCompiler(
        './es-module/template/index.js',
        {},
        {
          module: {
            rules: [
              {
                test: /\.css$/i,
                use: [
                  {
                    loader: MiniCssExtractPlugin.loader,
                    options: {
                      esModule: test.extractLoaderMode === 'esModule',
                    },
                  },
                  {
                    loader: path.resolve(__dirname, '../src'),
                    options: {
                      esModule: test.localLoaderMode === 'esModule',
                      modules: true,
                    },
                  },
                ],
              },
            ],
          },
          plugins: [
            new MiniCssExtractPlugin({
              filename: '[name].css',
              chunkFilename: '[id].css',
            }),
          ],
        }
      );
      const stats = await compile(compiler);

      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });
  }

  it('should emit error when class has unsupported name', async () => {
    const compiler = getCompiler('./es-module/named/broken/index.js', {
      esModule: true,
      modules: {
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats, true)).toMatchSnapshot('errors');
  });

  it('should emit error when namedExport true && esModule false', async () => {
    const compiler = getCompiler('./es-module/named/base/index.js', {
      esModule: false,
      modules: {
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
