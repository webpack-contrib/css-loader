const { webpack, evaluated } = require('./helpers');

describe('camelCase option', () => {
  it('true', async () => {
    const config = {
      loader: {
        options: {
          modules: true,
          camelCase: true,
        },
      },
    };
    const testId = './modules/camelCase.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);
    const evaluatedModule = evaluated(module.source);

    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('locals');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('not specified', async () => {
    const config = { loader: { options: { modules: true } } };
    const testId = './modules/camelCase.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);
    const evaluatedModule = evaluated(module.source);

    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('locals');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('dashes', async () => {
    const config = {
      loader: {
        options: {
          modules: true,
          camelCase: 'dashes',
        },
      },
    };
    const testId = './modules/camelCase.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);
    const evaluatedModule = evaluated(module.source);

    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('locals');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('only', async () => {
    const config = {
      loader: {
        options: {
          modules: true,
          camelCase: 'only',
        },
      },
    };
    const testId = './modules/camelCase.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);
    const evaluatedModule = evaluated(module.source);

    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('locals');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('dashesOnly', async () => {
    const config = {
      loader: {
        options: {
          modules: true,
          camelCase: 'dashesOnly',
        },
      },
    };
    const testId = './modules/camelCase.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);
    const evaluatedModule = evaluated(module.source);

    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('locals');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });
});
