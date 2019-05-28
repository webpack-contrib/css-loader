import path from 'path';
import fs from 'fs';

import { webpack, evaluated } from './helpers';

const testCasesPath = path.join(__dirname, 'fixtures/modules/tests-cases');
const testCases = fs.readdirSync(testCasesPath);

describe('modules', () => {
  [false, true].forEach((exportOnlyLocalsValue) => {
    [
      true,
      false,
      'local',
      'global',
      { mode: 'local' },
      { mode: 'global' },
    ].forEach((modulesValue) => {
      testCases.forEach((name) => {
        it(`case \`${name}\`: (export \`${
          exportOnlyLocalsValue ? 'only locals' : 'all'
        }\`) (\`modules\` value is \`${
          modulesValue.mode
            ? `object with mode ${modulesValue.mode}`
            : modulesValue
        })\``, async () => {
          const config = {
            loader: {
              options: {
                modules: modulesValue.mode
                  ? {
                      mode: modulesValue.mode,
                      localIdentName: '_[local]',
                    }
                  : modulesValue,
                exportOnlyLocals: exportOnlyLocalsValue,
              },
            },
          };
          const testId = `./modules/tests-cases/${name}/source.css`;
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
    });
  });

  it('should respects localIdentName option', async () => {
    const config = {
      loader: {
        options: {
          modules: {
            localIdentName: '[name]--[local]--[hash:base64:5]',
            context: path.resolve(__dirname),
          },
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

  it('should respects context option', async () => {
    const config = {
      loader: {
        options: {
          modules: {
            localIdentName: '[hash:base64:8]',
            context: path.resolve(__dirname),
          },
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

  it('should respects path in localIdentName option', async () => {
    const config = {
      loader: {
        options: {
          modules: {
            localIdentName: '[path]--[name]--[local]',
            context: path.resolve(__dirname),
          },
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

  it('should respects hashPrefix option with localIdentName option', async () => {
    const config = {
      loader: {
        options: {
          modules: {
            localIdentName: '[local]--[hash]',
            hashPrefix: 'x',
          },
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

  it('should prefixes leading hyphen + digit with underscore with localIdentName option', async () => {
    const config = {
      loader: {
        options: {
          modules: {
            localIdentName: '-1[local]',
          },
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

  it('should prefixes two leading hyphens with underscore with localIdentName option', async () => {
    const config = {
      loader: {
        options: {
          modules: {
            localIdentName: '--[local]',
          },
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

  it('should saves underscore prefix in exported class names with localIdentName option', async () => {
    const config = {
      loader: {
        options: {
          modules: {
            localIdentName: '[local]',
          },
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

  it('should correctly replace escaped symbols in selector with localIdentName option', async () => {
    const config = {
      loader: {
        options: {
          modules: {
            localIdentName: '[local]--[hash:base64:4]',
          },
          importLoaders: 2,
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

  it('should respects getLocalIdent option (local mode)', async () => {
    const config = {
      loader: {
        options: {
          modules: {
            getLocalIdent() {
              return 'foo';
            },
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

  it('should accepts all arguments for getLocalIdent option', async () => {
    const config = {
      loader: {
        options: {
          modules: {
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

  it('should respects getLocalIdent option (global mode)', async () => {
    const config = {
      loader: {
        options: {
          modules: {
            getLocalIdent() {
              return 'foo';
            },
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

  it('composes should supports resolving', async () => {
    const config = {
      loader: { options: { import: true, modules: true } },
    };
    const testId = './modules/composes.css';
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

  it('issue #286', async () => {
    const config = {
      loader: {
        test: /source\.css$/,
        options: {
          importLoaders: false,
          modules: {
            localIdentName: 'b--[local]',
          },
        },
      },
      additionalLoader: {
        test: /dep\.css$/,
        loader: path.resolve(__dirname, '../src/index.js'),
        options: {
          importLoaders: false,
          modules: {
            localIdentName: 'a--[local]',
          },
        },
      },
    };
    const testId = './modules/issue-286/source.css';
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

  it('issue #636', async () => {
    const config = {
      loader: {
        test: /\.s[ca]ss$/i,
        options: {
          modules: {
            localIdentName: '[local]',
            getLocalIdent: (context, localIdentName, localName) =>
              `prefix-${localName}`,
          },
          importLoaders: 1,
        },
      },
      sassLoader: true,
      sassLoaderOptions: {
        // eslint-disable-next-line global-require
        implementation: require('sass'),
      },
    };
    const testId = './modules/issue-636/source.scss';
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

  it('issue #861', async () => {
    const config = {
      loader: { options: { modules: true } },
    };
    const testId = './modules/resolving-inside-node-modules.css';
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
