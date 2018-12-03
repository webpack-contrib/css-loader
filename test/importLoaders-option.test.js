const postcssPresetEnv = require('postcss-preset-env');

const { webpack, evaluated } = require('./helpers');

describe('importLoaders option', () => {
  it('not specify (no loader before)', async () => {
    // It is hard to test `postcss` on reuse `ast`, please look on coverage before merging
    const config = {
      postcssLoader: true,
      postcssLoaderOptions: {
        plugins: () => [postcssPresetEnv({ stage: 0 })],
      },
    };
    const testId = './nested-import/source.css';
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

  it('1 (no loaders before)', async () => {
    const config = {
      loader: { options: { importLoaders: 1 } },
    };
    const testId = './nested-import/source.css';
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

  it('0 (`postcss-loader` before)', async () => {
    const config = {
      loader: { options: { importLoaders: 0 } },
      postcssLoader: true,
      postcssLoaderOptions: {
        plugins: () => [postcssPresetEnv({ stage: 0 })],
      },
    };
    const testId = './nested-import/source.css';
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

  it('1 (`postcss-loader` before)', async () => {
    const config = {
      loader: { options: { importLoaders: 1 } },
      postcssLoader: true,
      postcssLoaderOptions: {
        plugins: () => [postcssPresetEnv({ stage: 0 })],
      },
    };
    const testId = './nested-import/source.css';
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

  it('2 (`postcss-loader` before)', async () => {
    const config = {
      loader: { options: { importLoaders: 2 } },
      postcssLoader: true,
      postcssLoaderOptions: {
        plugins: () => [postcssPresetEnv({ stage: 0 })],
      },
    };
    const testId = './nested-import/source.css';
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
