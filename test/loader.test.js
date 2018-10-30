import path from 'path';

import postcss from 'postcss';
import postcssPresetEnv from 'postcss-preset-env';

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

  test('using together with "sass-loader"', async () => {
    const config = {
      rules: [
        {
          test: /\.s[ca]ss$/i,
          use: [
            {
              loader: path.resolve(__dirname, '../src'),
              options: {},
            },
            {
              loader: 'sass-loader',
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
    const stats = await webpack('sass-loader/basic.scss', config);
    const { modules } = stats.toJson();
    const [, , , module] = modules;
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
                        // Exports
                        {
                          type: 'css-loader',
                          plugin: 'postcss-message-api',
                          modify: (moduleObj) => {
                            moduleObj.exports.push(
                              `exports.locals = { foo: "bar" };`
                            );

                            return moduleObj;
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
    const [, , , module] = modules;

    // We don't need evaluated module here, because modules doesn't exists in graph
    expect(module.source).toMatchSnapshot('module');

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });
});
