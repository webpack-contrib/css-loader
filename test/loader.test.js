import path from 'path';

import postcss from 'postcss';
import postcssPresetEnv from 'postcss-preset-env';

import webpack from './helpers/compiler';
import evaluated from './helpers/evaluated';

import { normalizeErrors } from './helpers/utils';

describe('loader', () => {
  it('basic', async () => {
    const stats = await webpack('basic.js');
    const { modules } = stats.toJson();
    const [, runtime, escape, module] = modules;
    const evaluatedModule = evaluated(module.source, modules);

    expect(runtime.source).toMatchSnapshot('runtime');
    expect(escape.source).toMatchSnapshot('escape');
    expect(module.source).toMatchSnapshot('module');
    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('basic (css endpoint)', async () => {
    const stats = await webpack('basic.css');
    const { modules } = stats.toJson();
    const [, runtime, escape, module] = modules;
    const evaluatedModule = evaluated(module.source, modules);

    expect(runtime.source).toMatchSnapshot('runtime');
    expect(escape.source).toMatchSnapshot('escape');
    expect(module.source).toMatchSnapshot('module');
    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('empty options', async () => {
    const stats = await webpack('empty.css');
    const { modules } = stats.toJson();
    const [, module] = modules;
    const evaluatedModule = evaluated(module.source, modules);

    expect(module.source).toMatchSnapshot('module');
    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('error when no loader for url assets', async () => {
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

  it('using together with "postcss-loader" (reuse ast)', async () => {
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

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('using together with "sass-loader"', async () => {
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

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('message api', async () => {
    const postcssMessageApiPlugin = postcss.plugin(
      'postcss-message-api',
      () => (root, result) => {
        result.messages.push(
          // Custom message
          {
            type: 'unknown',
            plugin: 'postcss-plugin-name',
            unknown() {
              return 'unknown';
            },
          },
          // Import
          {
            type: 'import',
            plugin: 'postcss-plugin-name',
            import(accumulator) {
              return [
                accumulator,
                'var otherImage = require("./other-img.png");',
              ].join('\n');
            },
          },
          // Invalid
          {
            type: 'import',
            plugin: 'postcss-plugin-name',
            fn() {
              return 'invalid';
            },
          },
          // Error
          {
            type: 'import',
            plugin: 'postcss-plugin-name',
            import() {
              throw new Error('Error');
            },
          },
          // Module
          {
            type: 'module',
            plugin: 'postcss-plugin-name',
            module(accumulator) {
              return accumulator
                .replace(
                  new RegExp('___REPLACED_PROPERTY___', 'g'),
                  `background`
                )
                .replace(new RegExp('___REPLACED_FUNCTION___', 'g'), `url`)
                .replace(
                  new RegExp('___REPLACED_FUNCTION_ARGUMENT___', 'g'),
                  `" + otherImage + "`
                );
            },
          },
          // Export
          {
            type: 'export',
            plugin: 'postcss-plugin-name',
            export(accumulator) {
              return [
                accumulator,
                `exports.locals = { foo: "bar", bar: "foo" };\n`,
              ].join('');
            },
          }
        );
      }
    );
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
                plugins: () => [postcssMessageApiPlugin()],
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
    const evaluatedModule = evaluated(module.source, modules);

    // We don't need evaluated module here, because modules doesn't exists in graph
    expect(module.source).toMatchSnapshot('module');
    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');

    expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
      'warnings'
    );
    expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot('errors');
  });
});
