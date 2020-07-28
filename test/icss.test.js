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
        modules: false,
        icss: true,
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
});
