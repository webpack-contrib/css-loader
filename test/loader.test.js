import path from 'path';

import postcss from 'postcss';
import postcssPresetEnv from 'postcss-preset-env';
import postcssIcssValues from 'postcss-icss-values';
import postcssIcssSelectors from 'postcss-icss-selectors';
import postcssIcssComposes from 'postcss-icss-composes';
import postcssIcssKeyframes from 'postcss-icss-keyframes';
import genericNames from 'generic-names';

import webpack from './helpers/compiler';
import evaluated from './helpers/evaluated';

describe('loader', () => {
  test('basic', async () => {
    const stats = await webpack('basic.js');
    const { modules } = stats.toJson();
    const [, runtime, escape, module] = modules;
    const evaluatedModule = evaluated(module.source, modules);

    expect(runtime.source).toMatchSnapshot('runtime');
    expect(escape.source).toMatchSnapshot('escape');
    expect(module.source).toMatchSnapshot('module');
    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('export (evaluated)');

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  test('basic (css endpoint)', async () => {
    const stats = await webpack('basic.css');
    const { modules } = stats.toJson();
    const [, runtime, escape, module] = modules;
    const evaluatedModule = evaluated(module.source, modules);

    expect(runtime.source).toMatchSnapshot('runtime');
    expect(escape.source).toMatchSnapshot('escape');
    expect(module.source).toMatchSnapshot('module');
    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('export (evaluated)');

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  test('empty options', async () => {
    const stats = await webpack('empty.css');
    const { modules } = stats.toJson();
    const [, module] = modules;
    const evaluatedModule = evaluated(module.source, modules);

    expect(module.source).toMatchSnapshot('module');
    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('export (evaluated)');

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
    const stats = await webpack('basic.css', config);

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
            loader: 'file-loader',
          },
        },
      ],
    };
    const stats = await webpack('postcss-present-env.css', config);
    const { modules } = stats.toJson();
    const [, , module] = modules;
    const evaluatedModule = evaluated(module.source, modules);

    expect(module.source).toMatchSnapshot('module');
    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('export (evaluated)');

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  test('ICSS (next generation of css modules)', async () => {
    const config = {
      rules: [
        {
          test: /\.css$/,
          use: [
            {
              loader: path.resolve(__dirname, '../src'),
              options: {
                importLoaders: 1,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                plugins: (loader) => [
                  postcssIcssValues(),
                  postcssIcssSelectors({
                    mode: 'global',
                    generateScopedName: genericNames('[hash:base64]', {
                      hashPrefix: '',
                      context: loader.rootContext,
                    }),
                  }),
                  postcssIcssComposes(),
                  postcssIcssKeyframes({
                    generateScopedName: genericNames('[hash:base64]', {
                      hashPrefix: '',
                      context: loader.rootContext,
                    }),
                  }),
                ],
              },
            },
          ],
        },
        {
          test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
          use: {
            loader: 'file-loader',
          },
        },
      ],
    };
    const stats = await webpack('icss/basic.css', config);
    const { modules } = stats.toJson();
    const [, , , , , , , , module] = modules;

    const evaluatedModule = evaluated(module.source, modules);

    expect(module.source).toMatchSnapshot('module');
    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('export (evaluated)');

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  test('message api', async () => {
    const config = {
      rules: [
        {
          test: /\.css$/,
          use: [
            {
              loader: path.resolve(__dirname, '../src'),
              options: {
                importLoaders: 1,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                plugins: () => [
                  postcss.plugin(
                    'postcss-message-api',
                    () => (root, result) => {
                      result.messages.push(
                        // Empty `import` message
                        {
                          type: 'import',
                          plugin: 'postcss-message-api',
                        },
                        // Empty `export` message
                        {
                          type: 'export',
                          plugin: 'postcss-message-api',
                        },
                        {
                          type: 'import',
                          plugin: 'postcss-message-api',
                          tokens: {
                            'imported-message.css': {
                              '{media}': '',
                            },
                          },
                        },
                        // Duplicate
                        {
                          type: 'import',
                          plugin: 'postcss-message-api',
                          tokens: {
                            'imported-message.css': {
                              '{media}': '',
                            },
                          },
                        },
                        {
                          type: 'import',
                          plugin: 'postcss-message-api',
                          tokens: {
                            'other-imported-message.css': {
                              '{media}': 'print',
                            },
                          },
                        },
                        {
                          type: 'export',
                          plugin: 'postcss-message-api',
                          tokens: {
                            foo: 'bar',
                          },
                        },
                        {
                          type: 'export',
                          plugin: 'postcss-message-api',
                          tokens: {
                            bar: 'foo',
                          },
                        }
                      );
                    }
                  )(),
                ],
              },
            },
          ],
        },
        {
          test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
          use: {
            loader: 'file-loader',
          },
        },
      ],
    };
    const stats = await webpack('messages-api/basic.css', config);
    const { modules } = stats.toJson();
    const [, , , , , module] = modules;

    // We don't need evaluated module here, because modules doesn't exists in graph
    expect(module.source).toMatchSnapshot('module');

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  test('custom export', async () => {
    const stats = await webpack('icss/export.css');
    const [, module] = stats.toJson().modules;
    const evaluatedModule = evaluated(module.source);

    expect(module.source).toMatchSnapshot('module');
    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('export');

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });
});
