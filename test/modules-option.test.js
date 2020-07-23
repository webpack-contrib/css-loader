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

jest.setTimeout(60000);

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
        localIdentContext: path.resolve(__dirname),
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
        localIdentContext: path.resolve(__dirname),
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
        localIdentContext: path.resolve(__dirname),
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
        localIdentHashPrefix: 'x',
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
        localIdentContext: 'context',
        localIdentHashPrefix: 'hash',
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
          expect(options.context).toBeDefined();

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

  it('should support resolving in composes preprocessor files with extensions', async () => {
    const compiler = getCompiler(
      './modules/composes/composes-preprocessors.js',
      {
        modules: {
          mode: 'local',
          exportGlobals: true,
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/composes/composes-preprocessors.css', stats)
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
              use: [
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

  it('should dedupe same modules in one module (issue #1037)', async () => {
    const compiler = getCompiler('./modules/dedupe/source.js', {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/dedupe/source.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('issue #1063', async () => {
    const compiler = getCompiler('./modules/issue-1063/issue-1063.js', {
      modules: {
        mode: (resourcePath) => {
          if (/pure.css$/i.test(resourcePath)) {
            return 'pure';
          }

          if (/global.css$/i.test(resourcePath)) {
            return 'global';
          }

          return 'local';
        },
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/issue-1063/local.css', stats)
    ).toMatchSnapshot('module with the `local` mode');
    expect(
      getModuleSource('./modules/issue-1063/global.css', stats)
    ).toMatchSnapshot('module with the `global` mode');
    expect(
      getModuleSource('./modules/issue-1063/pure.css', stats)
    ).toMatchSnapshot('module with the `pure` mode');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('issue #1063 throw error', async () => {
    const compiler = getCompiler('./modules/issue-1063/issue-1063.js', {
      modules: {
        mode: () => {
          return 'not local, global or pure';
        },
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/issue-1063/local.css', stats)
    ).toMatchSnapshot('module');
    expect(
      getModuleSource('./modules/issue-1063/global.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with the `exportGlobals` option (the `mode` option is `global`)', async () => {
    const compiler = getCompiler(
      './modules/exportGlobals-global/exportGlobals.js',
      {
        modules: {
          mode: 'local',
          exportGlobals: true,
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/exportGlobals-global/exportGlobals.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with the `exportGlobals` option (the `mode` option is `local`)', async () => {
    const compiler = getCompiler(
      './modules/exportGlobals-local/exportGlobals.js',
      {
        modules: {
          mode: 'global',
          exportGlobals: true,
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/exportGlobals-local/exportGlobals.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with the `exportGlobals` option (the `mode` option is `pure`)', async () => {
    const compiler = getCompiler(
      './modules/exportGlobals-pure/exportGlobals.js',
      {
        modules: {
          mode: 'pure',
          exportGlobals: true,
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/exportGlobals-pure/exportGlobals.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with the "auto" by default', async () => {
    const compiler = getCompiler('./modules/mode/modules.js');
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/mode/relative.module.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with the "auto" when it is "false"', async () => {
    const compiler = getCompiler('./modules/mode/modules.js', {
      modules: {
        auto: false,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/mode/relative.module.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with the "auto" when it is "true"', async () => {
    const compiler = getCompiler('./modules/mode/modules.js', {
      modules: {
        auto: true,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/mode/relative.module.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a modules.auto RegExp that returns "true"', async () => {
    const compiler = getCompiler('./modules/mode/modules.js', {
      modules: {
        auto: /relative\.module\.css$/,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/mode/relative.module.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a modules.auto RegExp that returns "false"', async () => {
    const compiler = getCompiler('./modules/mode/modules.js', {
      modules: {
        auto: /will no pass/,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/mode/relative.module.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a modules.auto Function that returns "true"', async () => {
    const compiler = getCompiler('./modules/mode/modules.js', {
      modules: {
        auto: (relativePath) => relativePath.endsWith('module.css'),
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/mode/relative.module.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a modules.auto Function that returns "false"', async () => {
    const compiler = getCompiler('./modules/mode/modules.js', {
      modules: {
        auto: (relativePath) => relativePath.endsWith('will no pass'),
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/mode/relative.module.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should resolve package from node_modules with and without tilde', async () => {
    const compiler = getCompiler('./modules/issue-914/source.js', {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/issue-914/source.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should throw an error on unresolved import', async () => {
    const compiler = getCompiler('./modules/unresolved/source.js', {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats, true)).toMatchSnapshot('errors');
  });

  it('should work and respect the "localConvention" option with the "asIs" value', async () => {
    const compiler = getCompiler(
      './modules/localsConvention/localsConvention.js',
      {
        modules: {
          mode: 'local',
          exportLocalsConvention: 'asIs',
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localsConvention/localsConvention.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work and respect the "localConvention" option with the "camelCase" value', async () => {
    const compiler = getCompiler(
      './modules/localsConvention/localsConvention.js',
      {
        modules: {
          mode: 'local',
          exportLocalsConvention: 'camelCase',
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localsConvention/localsConvention.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work and respect the "localConvention" option with the "camelCaseOnly" value', async () => {
    const compiler = getCompiler(
      './modules/localsConvention/localsConvention.js',
      {
        modules: {
          mode: 'local',
          exportLocalsConvention: 'camelCaseOnly',
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localsConvention/localsConvention.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work and respect the "localConvention" option with the "dashes" value', async () => {
    const compiler = getCompiler(
      './modules/localsConvention/localsConvention.js',
      {
        modules: {
          mode: 'local',
          exportLocalsConvention: 'dashes',
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localsConvention/localsConvention.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work and respect the "localConvention" option with the "dashesOnly" value', async () => {
    const compiler = getCompiler(
      './modules/localsConvention/localsConvention.js',
      {
        modules: {
          mode: 'local',
          exportLocalsConvention: 'dashesOnly',
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localsConvention/localsConvention.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work and respect the "exportOnlyLocals" option', async () => {
    const compiler = getCompiler('./modules/composes/composes.js', {
      modules: {
        mode: 'local',
        localIdentName: '_[local]',
        exportOnlyLocals: true,
      },
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

  it('should work and respect the "exportOnlyLocals" option with the "esModule" option', async () => {
    const compiler = getCompiler('./modules/composes/composes.js', {
      modules: {
        mode: 'local',
        localIdentName: '_[local]',
        exportOnlyLocals: true,
      },
      esModule: true,
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

  it('should work with an empty object value', async () => {
    const compiler = getCompiler('./modules/pure/pure.js', { modules: {} });
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

  it('should work with the "namedExport" option', async () => {
    const compiler = getCompiler('./modules/namedExport/base/index.js', {
      modules: {
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/namedExport/base/index.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with the "namedExport" option with nested import', async () => {
    const compiler = getCompiler('./modules/namedExport/nested/index.js', {
      esModule: true,
      modules: {
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/namedExport/nested/index.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work js template with "namedExport" option', async () => {
    const compiler = getCompiler('./modules/namedExport/template/index.js', {
      esModule: true,
      modules: {
        localIdentName: '[local]',
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/namedExport/template/index.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should throw an error when the "namedExport" option is "true", but the "esModule" is "false"', async () => {
    const compiler = getCompiler('./modules/namedExport/base/index.js', {
      esModule: false,
      modules: {
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats, true)).toMatchSnapshot('errors');
  });

  it('should throw an error when the "namedExport" is enabled and the "exportLocalsConvention" options has not "camelCaseOnly" value', async () => {
    const compiler = getCompiler('./modules/namedExport/broken/index.js', {
      esModule: true,
      modules: {
        namedExport: true,
        exportLocalsConvention: 'dashes',
      },
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats, true)).toMatchSnapshot('errors');
  });

  it('should throw an error when class has unsupported name (JavaScript reserved words)', async () => {
    const compiler = getCompiler('./modules/namedExport/broken/index.js', {
      esModule: true,
      modules: {
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats, true)).toMatchSnapshot('errors');
  });

  it('should work with "url"', async () => {
    const compiler = getCompiler('./modules/url/source.js', {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./modules/url/source.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with "url" and "namedExport"', async () => {
    const compiler = getCompiler('./modules/url/source.js', {
      modules: {
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./modules/url/source.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
