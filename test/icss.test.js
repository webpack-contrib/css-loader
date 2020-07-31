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

const testCasesPath = path.join(__dirname, 'fixtures/icss/tests-cases');
const testCases = fs.readdirSync(testCasesPath);

describe('ICSS', () => {
  testCases.forEach((name) => {
    it(`show work with the case "${name}"`, async () => {
      const compiler = getCompiler(`./icss/tests-cases/${name}/source.js`, {
        modules: { type: 'icss' },
      });
      const stats = await compile(compiler);

      expect(
        getModuleSource(`./icss/tests-cases/${name}/source.css`, stats)
      ).toMatchSnapshot('module');
      expect(
        getExecutedCode('main.bundle.js', compiler, stats)
      ).toMatchSnapshot('result');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });
  });

  it(`show warn about icss deprecation`, async () => {
    const stats = await compile(
      getCompiler(`./icss/tests-cases/import/source.js`, {
        modules: false,
        icss: true,
      })
    );
    const warnings = getWarnings(stats);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain(
      'The `icss` option is deprecated, use modules.type: "icss" instead'
    );
  });

  it(`show throw when both options are specified`, async () => {
    const stats = await compile(
      getCompiler(`./icss/tests-cases/import/source.js`, {
        modules: { type: 'full' },
        icss: true,
      })
    );
    const errors = getErrors(stats);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(
      'The "modules.type" option cannot be set with "options.icss", remove the `icss` option and just use `type`'
    );
  });

  it(`work with exports only`, async () => {
    const compiler = getCompiler(`./icss/tests-cases/exports-only/source.js`, {
      modules: {
        type: 'icss',
        exportOnlyLocals: true,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource(`./icss/tests-cases/exports-only/source.css`, stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
