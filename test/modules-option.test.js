import path from 'path';
import fs from 'fs';

import {
  compile,
  getCompiler,
  getErrors,
  getExecutedCode,
  getModuleSource,
  getWarnings,
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
      it(`should work with case \`${name}\` (\`modules\` value is \`${
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
          getExecutedCode('main.bundle.js', compiler, stats)
        ).toMatchSnapshot('result');
        expect(getWarnings(stats)).toMatchSnapshot('warnings');
        expect(getErrors(stats)).toMatchSnapshot('errors');
      });
    });
  });

  it('should work and support "pure" mode', async () => {
    const compiler = getCompiler('./modules/pure/pure.js', { modules: 'pure' });
    const stats = await compile(compiler);

    expect(getModuleSource('./modules/pure/pure.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work and support "pure" mode #2', async () => {
    const compiler = getCompiler('./modules/pure/pure.js', {
      modules: { mode: 'pure' },
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./modules/pure/pure.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with the "[local]" placeholder for the "localIdentName" option', async () => {
    const compiler = getCompiler('./modules/localIdentName/localIdentName.js', {
      modules: { localIdentName: '[local]' },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work and respect the "localIdentName" option', async () => {
    const compiler = getCompiler('./modules/localIdentName/localIdentName.js', {
      modules: {
        localIdentName: '[name]--[local]--[hash:base64:5]',
        context: path.resolve(__dirname),
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work and respect the "context" option', async () => {
    const compiler = getCompiler('./modules/localIdentName/localIdentName.js', {
      modules: {
        localIdentName: '[hash:base64:8]',
        context: path.resolve(__dirname),
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work and respect the "path" placeholder', async () => {
    const compiler = getCompiler('./modules/localIdentName/localIdentName.js', {
      modules: {
        localIdentName: '[path][name]__[local]',
        context: path.resolve(__dirname),
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work and respect the "hashPrefix" option', async () => {
    const compiler = getCompiler('./modules/localIdentName/localIdentName.js', {
      modules: {
        localIdentName: '[local]--[hash]',
        hashPrefix: 'x',
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work and prefix leading hyphen when digit is first', async () => {
    const compiler = getCompiler('./modules/localIdentName/localIdentName.js', {
      modules: { localIdentName: '-1[local]' },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should should work with two leading hyphens', async () => {
    const compiler = getCompiler('./modules/localIdentName/localIdentName.js', {
      modules: { localIdentName: '--[local]' },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should should work with two leading underscore', async () => {
    const compiler = getCompiler('./modules/localIdentName/localIdentName.js', {
      modules: { localIdentName: '__[local]' },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work and correctly replace escaped symbols', async () => {
    const compiler = getCompiler('./modules/localIdentName/localIdentName.js', {
      modules: { localIdentName: '[local]--[hash:base64:4]' },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work and respect the "getLocalIdent" option', async () => {
    expect.assertions(382);

    const compiler = getCompiler('./modules/localIdentName/localIdentName.js', {
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
      getModuleSource('./modules/localIdentName/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work and has "undefined" context if no context was given', async () => {
    expect.assertions(58);

    const compiler = getCompiler('./modules/localIdentName/localIdentName.js', {
      modules: {
        getLocalIdent(loaderContext, localIdentName, localName, options) {
          expect(options.context).toBeUndefined();

          return 'foo';
        },
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work when the "getLocalIdent" option returns "false"', async () => {
    const compiler = getCompiler('./modules/localIdentName/localIdentName.js', {
      modules: {
        localIdentName: '[local]',
        getLocalIdent: () => false,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localIdentName/localIdentName.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should support resolving in composes', async () => {
    const compiler = getCompiler('./modules/composes/composes.js', {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/composes/composes.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
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
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
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
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('issue #861', async () => {
    const compiler = getCompiler(
      './modules/issue-861/resolving-from-node_modules.js',
      {
        modules: true,
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource(
        './modules/issue-861/resolving-from-node_modules.css',
        stats
      )
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
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
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('issue #967', async () => {
    const compiler = getCompiler('./modules/issue-967/path-placeholder.js', {
      modules: {
        mode: 'local',
        localIdentName:
          '[path][name]__[local]__/-sep-?-sep-<-sep->-sep-\\\\-sep-:-sep-*-sep-|-sep-"-sep-:',
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/issue-967/path-placeholder.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('issue #980', async () => {
    const compiler = getCompiler(
      './modules/issue-980/file.with.many.dots.in.name.js',
      {
        modules: {
          localIdentName: '[name]_[local]_[hash:base64:5]',
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource(
        './modules/issue-980/file.with.many.dots.in.name.css',
        stats
      )
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('issue #995', async () => {
    const compiler = getCompiler('./modules/issue-995/issue-995.js', {
      modules: {
        mode: 'global',
        localIdentName: '😀',
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/issue-995/issue-995.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should avoid unnecessary "require"', async () => {
    const compiler = getCompiler('./modules/composes/composes-duplicate.js', {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/composes/composes-duplicate.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should keep order', async () => {
    const compiler = getCompiler('./modules/order/index.js', { modules: true });
    const stats = await compile(compiler);

    expect(getModuleSource('./modules/order/index.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
