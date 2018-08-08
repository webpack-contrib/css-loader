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

  test('empty options', async () => {
    const stats = await webpack('empty.js');
    const [, module] = stats.toJson().modules;

    expect(evaluated(module.source)).toMatchSnapshot('module');

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
