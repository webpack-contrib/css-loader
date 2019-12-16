import path from 'path';
import fs from 'fs';

import {
  compile,
  execute,
  getCompiler,
  getErrors,
  getModuleSource,
  getWarnings,
  readAsset,
} from './helpers/index';

const testCasesPath = path.join(__dirname, 'fixtures/modules/tests-cases');
const testCases = fs.readdirSync(testCasesPath);

jest.setTimeout(30000);

describe('"modules" option', () => {
  [
    true,
    false,
    'local',
    'global',
    { mode: 'local' },
    { mode: 'global' },
  ].forEach((modulesValue) => {
    testCases.forEach((name) => {
      it(`case \`${name}\` (\`modules\` value is \`${
        modulesValue.mode
          ? `object with mode ${modulesValue.mode}`
          : modulesValue
      })\``, async () => {
        const pathToTest = `./modules/tests-cases/${name}/source.js`;
        const moduleId = `./modules/tests-cases/${name}/source.css`;
        const compiler = getCompiler(pathToTest, {
          modules: modulesValue.mode
            ? { mode: modulesValue.mode, localIdentName: '_[local]' }
            : modulesValue,
        });
        const stats = await compile(compiler);

        expect(getModuleSource(moduleId, stats)).toMatchSnapshot('module');
        expect(
          execute(readAsset('main.bundle.js', compiler, stats))
        ).toMatchSnapshot('result');
        expect(getWarnings(stats)).toMatchSnapshot('warnings');
        expect(getErrors(stats)).toMatchSnapshot('errors');
      });
    });
  });

  it('should support "pure" value', async () => {
    const compiler = getCompiler('./modules/pure.js', { modules: 'pure' });
    const stats = await compile(compiler);

    expect(getModuleSource('./modules/pure.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should support "pure" value #2', async () => {
    const compiler = getCompiler('./modules/pure.js', {
      modules: { mode: 'pure' },
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./modules/pure.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work underscore prefix in exported class names with "localIdentName" option with "[local]"', async () => {
    const compiler = getCompiler('./modules/localIdentName.js', {
      modules: { localIdentName: '[local]' },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should respects localIdentName option', async () => {
    const compiler = getCompiler('./modules/localIdentName.js', {
      modules: {
        localIdentName: '[name]--[local]--[hash:base64:5]',
        context: path.resolve(__dirname),
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should respects context option', async () => {
    const compiler = getCompiler('./modules/localIdentName.js', {
      modules: {
        localIdentName: '[hash:base64:8]',
        context: path.resolve(__dirname),
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should respects path in localIdentName option', async () => {
    const compiler = getCompiler('./modules/localIdentName.js', {
      modules: {
        localIdentName: '[path][name]__[local]',
        context: path.resolve(__dirname),
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should respect hashPrefix option with localIdentName option', async () => {
    const compiler = getCompiler('./modules/localIdentName.js', {
      modules: {
        localIdentName: '[local]--[hash]',
        hashPrefix: 'x',
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should prefixes leading hyphen + digit with underscore with localIdentName option', async () => {
    const compiler = getCompiler('./modules/localIdentName.js', {
      modules: { localIdentName: '-1[local]' },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should prefixes two leading hyphens with underscore with localIdentName option', async () => {
    const compiler = getCompiler('./modules/localIdentName.js', {
      modules: { localIdentName: '--[local]' },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should save underscore prefix in exported class names with "localIdentName" option', async () => {
    const compiler = getCompiler('./modules/localIdentName.js', {
      modules: { localIdentName: '__[local]' },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should correctly replace escaped symbols in selector with localIdentName option', async () => {
    const compiler = getCompiler('./modules/localIdentName.js', {
      modules: { localIdentName: '[local]--[hash:base64:4]' },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should respect the "getLocalIdent" option', async () => {
    expect.assertions(382);

    const compiler = getCompiler('./modules/localIdentName.js', {
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
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should have an undefined context if no context was given', async () => {
    expect.assertions(58);

    const compiler = getCompiler('./modules/localIdentName.js', {
      modules: {
        getLocalIdent(loaderContext, localIdentName, localName, options) {
          expect(options.context).toBeUndefined();

          return 'foo';
        },
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('getLocalIdent should be allowed to return false', async () => {
    const compiler = getCompiler('./modules/localIdentName.js', {
      modules: {
        localIdentName: '[local]',
        getLocalIdent: () => false,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('composes should supports resolving', async () => {
    const compiler = getCompiler('./modules/composes.js', {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./modules/composes.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('issue #286', async () => {
    const compiler = getCompiler(
      './modules/issue-286/source.js',
      {},
      {
        module: {
          rules: [
            {
              test: /source\.css$/,
              loader: path.resolve(__dirname, '../src'),
              options: {
                importLoaders: false,
                modules: {
                  localIdentName: 'b--[local]',
                },
              },
            },
            {
              test: /dep\.css$/,
              loader: path.resolve(__dirname, '../src'),
              options: {
                importLoaders: false,
                modules: {
                  localIdentName: 'a--[local]',
                },
              },
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/issue-286/source.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('issue #636', async () => {
    const compiler = getCompiler(
      './modules/issue-636/source.js',
      {},
      {
        module: {
          rules: [
            {
              test: /\.s[ca]ss$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: {
                    modules: {
                      localIdentName: '[local]',
                      getLocalIdent: (context, localIdentName, localName) =>
                        `prefix-${localName}`,
                    },
                    importLoaders: 1,
                  },
                },
                {
                  loader: 'sass-loader',
                  options: {
                    // eslint-disable-next-line global-require
                    implementation: require('sass'),
                  },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/issue-636/source.scss', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('issue #861', async () => {
    const compiler = getCompiler('./modules/resolving-inside-node-modules.js', {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/resolving-inside-node-modules.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('issue #967', async () => {
    const compiler = getCompiler('./modules/path-placeholder.js', {
      modules: {
        mode: 'local',
        localIdentName:
          '[path][name]__[local]__/-sep-?-sep-<-sep->-sep-\\\\-sep-:-sep-*-sep-|-sep-"-sep-:',
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/path-placeholder.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('issue #966', async () => {
    const compiler = getCompiler('./modules/issue-966/button.js', {
      modules: {
        getLocalIdent: (ctx, localIdentName, localName) => `${localName}.hey`,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/issue-966/button.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('issue #980', async () => {
    const compiler = getCompiler('./modules/file.with.many.dots.in.name.js', {
      modules: {
        localIdentName: '[name]_[local]_[hash:base64:5]',
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/file.with.many.dots.in.name.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('issue #995', async () => {
    const compiler = getCompiler('./modules/issue-995.js', {
      modules: {
        mode: 'global',
        localIdentName: '😀',
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./modules/issue-995.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should avoid unnecessary "require"', async () => {
    const compiler = getCompiler('./modules/composes-duplicate.js', {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/composes-duplicate.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should keep order', async () => {
    const compiler = getCompiler('./modules/order/index.js', { modules: true });
    const stats = await compile(compiler);

    expect(getModuleSource('./modules/order/index.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
