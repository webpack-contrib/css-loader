const path = require('path');

const { webpack, evaluated } = require('./helpers');

describe('localIdentName option', () => {
  it('basic', async () => {
    const testId = './modules/localIdentName.css';
    const stats = await webpack(testId);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);
    const evaluatedModule = evaluated(module.source, modules);

    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('locals');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('should have hash', async () => {
    const config = {
      loader: {
        options: {
          localIdentName: '[name]--[local]--[hash:base64:5]',
          context: path.resolve(__dirname),
        },
      },
    };
    const testId = './modules/localIdentName.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);
    const evaluatedModule = evaluated(module.source, modules);

    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('locals');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('should have path naming with context', async () => {
    const config = {
      loader: {
        options: {
          localIdentName: '[path]-[name]--[local]',
          context: path.resolve(__dirname),
        },
      },
    };
    const testId = './modules/localIdentName.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);
    const evaluatedModule = evaluated(module.source, modules);

    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('locals');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('should use hash prefix', async () => {
    const config = {
      loader: {
        options: { localIdentName: '[local]--[hash]', hashPrefix: 'x' },
      },
    };
    const testId = './modules/localIdentName.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);
    const evaluatedModule = evaluated(module.source, modules);

    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('locals');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('should prefixes leading hyphen + digit with underscore', async () => {
    const config = { loader: { options: { localIdentName: '-1[local]' } } };
    const testId = './modules/localIdentName.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);
    const evaluatedModule = evaluated(module.source, modules);

    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('locals');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('should prefixes two leading hyphens with underscore', async () => {
    const config = { loader: { options: { localIdentName: '--[local]' } } };
    const testId = './modules/localIdentName.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);
    const evaluatedModule = evaluated(module.source, modules);

    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('locals');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('should saves underscore prefix in exported class names', async () => {
    const config = { loader: { options: { localIdentName: '[local]' } } };
    const testId = './modules/localIdentName.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);
    const evaluatedModule = evaluated(module.source, modules);

    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('locals');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });
});
