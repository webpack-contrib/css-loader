const path = require('path');

const { webpack, evaluated } = require('./helpers');

describe('getLocalIdent option', () => {
  it('should work (`modules: true`)', async () => {
    const config = {
      loader: {
        options: {
          modules: true,
          getLocalIdent() {
            return 'foo';
          },
        },
      },
    };
    const testId = './modules/getLocalIdent.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);
    const evaluatedModule = evaluated(module.source);

    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('locals');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('should work (`modules: false`)', async () => {
    const config = {
      loader: {
        options: {
          modules: false,
          getLocalIdent() {
            return 'foo';
          },
        },
      },
    };
    const testId = './modules/getLocalIdent.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);
    const evaluatedModule = evaluated(module.source);

    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('locals');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('should accepts arguments', async () => {
    const config = {
      loader: {
        options: {
          modules: true,
          localIdentRegExp: 'regExp',
          context: 'context',
          hashPrefix: 'hash',
          getLocalIdent(loaderContext, localIdentName, localName, options) {
            expect(loaderContext).toBeDefined();
            expect(typeof localIdentName).toBe('string');
            expect(typeof localName).toBe('string');
            expect(options).toBeDefined();

            expect(options.regExp).toBe('regExp');
            expect(options.context).toBe('context');
            expect(options.hashPrefix).toBe('hash');

            return 'foo';
          },
        },
      },
    };
    const testId = './modules/getLocalIdent.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);
    const evaluatedModule = evaluated(module.source);

    expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
    expect(evaluatedModule.locals).toMatchSnapshot('locals');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('should respect `context` option', async () => {
    const config = {
      loader: {
        options: {
          context: path.resolve(__dirname, 'fixtures/modules'),
          modules: true,
        },
      },
    };
    const testId = './modules/getLocalIdent.css';
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
