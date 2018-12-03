const path = require('path');

const postcssPresetEnv = require('postcss-preset-env');

const { webpack, evaluated, normalizeErrors } = require('./helpers');

describe('loader', () => {
  it('should compile with `js` entry point', async () => {
    const stats = await webpack('basic.js');
    const { modules } = stats.toJson();
    const [, api, escape, module] = modules;

    expect(api.source).toMatchSnapshot('api');
    expect(escape.source).toMatchSnapshot('escape');
    expect(module.source).toMatchSnapshot('module');
    expect(evaluated(module.source, modules)).toMatchSnapshot(
      'module (evaluated)'
    );
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('should compile with `css` entry point', async () => {
    const stats = await webpack('basic.css');
    const { modules } = stats.toJson();
    const [, runtime, escape, module] = modules;

    expect(runtime.source).toMatchSnapshot('api');
    expect(escape.source).toMatchSnapshot('escape');
    expect(module.source).toMatchSnapshot('module');
    expect(evaluated(module.source, modules)).toMatchSnapshot(
      'module (evaluated)'
    );
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('should compile with empty css entry point', async () => {
    const testId = './empty.css';
    const stats = await webpack(testId);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);

    expect(module.source).toMatchSnapshot('module');
    expect(evaluated(module.source, modules)).toMatchSnapshot(
      'module (evaluated)'
    );
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('should compile with empty options', async () => {
    const config = { loader: { options: {} } };
    const testId = './empty.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);

    expect(module.source).toMatchSnapshot('module');
    expect(evaluated(module.source, modules)).toMatchSnapshot(
      'module (evaluated)'
    );
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('should throws error when no loader for assets', async () => {
    const config = {
      rules: [
        {
          test: /\.css$/,
          use: {
            loader: path.resolve(__dirname, '../index'),
          },
        },
      ],
    };
    const stats = await webpack('basic.css', config);

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('should throw error on invalid css syntax', async () => {
    const stats = await webpack('invalid.css');

    expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
      'warnings'
    );
    expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot('errors');
  });

  it('using together with "postcss-loader" and reuse `ast`', async () => {
    // It is hard to test `postcss` on reuse `ast`, please look on coverage before merging
    const config = {
      postcssLoader: true,
      postcssLoaderOptions: {
        plugins: () => [postcssPresetEnv({ stage: 0 })],
      },
    };
    const testId = './postcss-present-env/source.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);

    expect(module.source).toMatchSnapshot('module');
    expect(evaluated(module.source, modules)).toMatchSnapshot(
      'module (evaluated)'
    );
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('using together with "sass-loader"', async () => {
    const config = {
      loader: { test: /\.s[ca]ss$/i },
      sassLoader: true,
      sassLoaderOptions: {
        // eslint-disable-next-line global-require
        implementation: require('sass'),
      },
    };
    const testId = './scss/source.scss';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);

    expect(module.source).toMatchSnapshot('module');
    expect(evaluated(module.source, modules)).toMatchSnapshot(
      'module (evaluated)'
    );
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });
});
