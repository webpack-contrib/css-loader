import path from 'path';

import postcssPresetEnv from 'postcss-preset-env';

import webpack from './helpers/compiler';
import evaluated from './helpers/evaluated';

describe('loader', () => {
  test('basic', async () => {
    const stats = await webpack('basic.js');
    const [runtime, runtimeEscape, module] = stats.toJson().modules;

    expect(runtime.source).toMatchSnapshot('runtime');
    expect(runtimeEscape.source).toMatchSnapshot('runtimeEscape');
    expect(evaluated(module.source)).toMatchSnapshot('module');

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  test('empty', async () => {
    const stats = await webpack('empty.js');
    const [, module] = stats.toJson().modules;

    expect(evaluated(module.source)).toMatchSnapshot('module');

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  test('error when source code is invalid', async () => {
    const stats = await webpack('broken.js');

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  test('error when no loader for url assets', async () => {
    const config = {
      rules: [
        {
          test: /\.css$/,
          use: {
            loader: path.resolve(__dirname, '../src'),
          },
        },
      ],
    };
    const stats = await webpack('basic.js', config);

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  describe('validate options', async () => {
    test('unknown option', async () => {
      const config = {
        loader: {
          options: {
            unknow: true,
          },
        },
      };
      const stats = await webpack('basic.js', config);

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('url - true (boolean)', async () => {
      const config = {
        loader: {
          options: {
            url: true,
          },
        },
      };
      const stats = await webpack('basic.js', config);

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('url - false (boolean)', async () => {
      const config = {
        loader: {
          options: {
            url: false,
          },
        },
      };
      const stats = await webpack('basic.js', config);

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('url - true (string)', async () => {
      const config = {
        loader: {
          options: {
            url: 'true',
          },
        },
      };
      const stats = await webpack('basic.js', config);

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('import - true (boolean)', async () => {
      const config = {
        loader: {
          options: {
            import: true,
          },
        },
      };
      const stats = await webpack('basic.js', config);

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('import - false (boolean)', async () => {
      const config = {
        loader: {
          options: {
            import: false,
          },
        },
      };
      const stats = await webpack('basic.js', config);

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('import - true (string)', async () => {
      const config = {
        loader: {
          options: {
            import: 'true',
          },
        },
      };
      const stats = await webpack('basic.js', config);

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('sourceMap - true (boolean)', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: true,
          },
        },
      };
      const stats = await webpack('basic.js', config);

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('sourceMap - false (boolean)', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: false,
          },
        },
      };
      const stats = await webpack('basic.js', config);

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('sourceMap - true (string)', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: 'true',
          },
        },
      };
      const stats = await webpack('basic.js', config);

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('importLoaders - 0 (number)', async () => {
      const config = {
        loader: {
          options: {
            importLoaders: 0,
          },
        },
      };
      const stats = await webpack('basic.js', config);

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('importLoaders - 1 (number)', async () => {
      const config = {
        loader: {
          options: {
            importLoaders: 1,
          },
        },
      };
      const stats = await webpack('basic.js', config);

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('importLoaders - 1 (string)', async () => {
      const config = {
        loader: {
          options: {
            importLoaders: '1',
          },
        },
      };
      const stats = await webpack('basic.js', config);

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });
  });

  test('using together with "postcss-loader" (reuse ast)', async () => {
    const config = {
      rules: [
        {
          test: /\.css$/,
          use: [
            {
              loader: path.resolve(__dirname, '../src'),
              options: {},
            },
            {
              loader: 'postcss-loader',
              options: {
                plugins: () => [postcssPresetEnv({ stage: 0 })],
              },
            },
          ],
        },
        {
          test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
          use: {
            loader: 'url-loader',
          },
        },
      ],
    };
    const stats = await webpack('postcss-present-env.css', config);
    const [, , module] = stats.toJson().modules;

    expect(evaluated(module.source)).toMatchSnapshot('module');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  // Todo message api test
  // Todo test warnings
});
