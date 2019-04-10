import path from 'path';

import { webpack, evaluated } from './helpers';

describe('localIdentName option', () => {
  it('basic', async () => {
    const config = {
      loader: {
        options: {
          modules: true,
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

  it('should have only hash', async () => {
    const config = {
      loader: {
        options: {
          modules: true,
          localIdentName: '[hash:base64:8]',
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
          modules: true,
          localIdentName: '[path]--[name]--[local]',
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
        options: {
          modules: true,
          localIdentName: '[local]--[hash]',
          hashPrefix: 'x',
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

  it('should prefixes leading hyphen + digit with underscore', async () => {
    const config = {
      loader: {
        options: {
          modules: true,
          localIdentName: '-1[local]',
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

  it('should prefixes two leading hyphens with underscore', async () => {
    const config = {
      loader: {
        options: {
          modules: true,
          localIdentName: '--[local]',
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

  it('should saves underscore prefix in exported class names', async () => {
    const config = {
      loader: {
        options: {
          modules: true,
          localIdentName: '[local]',
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

  it('should correctly replace escaped symbols in selector', async () => {
    const config = {
      loader: {
        options: {
          modules: true,
          importLoaders: 2,
          localIdentName: '[local]--[hash:base64:4]',
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
});
