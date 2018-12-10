const path = require('path');
const fs = require('fs');

const { webpack, evaluated } = require('./helpers');

const testCasesPath = path.join(__dirname, 'fixtures/modules/tests-cases');
const testCases = fs.readdirSync(testCasesPath);

describe('modules', () => {
  [false, true].forEach((exportOnlyLocalsValue) => {
    [true, 'local', 'global', false].forEach((modulesValue) => {
      testCases.forEach((name) => {
        it(`case \`${name}\`: (export \`${
          exportOnlyLocalsValue ? 'only locals' : 'all'
        }\`) (\`modules\` value is \`${modulesValue})\``, async () => {
          const config = {
            loader: {
              options: {
                modules: modulesValue,
                exportOnlyLocals: exportOnlyLocalsValue,
                localIdentName: '_[local]',
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
          modules: true,
          localIdentName: 'b--[local]',
        },
      },
      additionalLoader: {
        test: /dep\.css$/,
        loader: path.resolve(__dirname, '../src/index.js'),
        options: {
          importLoaders: false,
          modules: true,
          localIdentName: 'a--[local]',
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
          modules: true,
          importLoaders: 1,
          localIdentName: '[local]',
          getLocalIdent: (context, localIdentName, localName) =>
            `prefix-${localName}`,
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
