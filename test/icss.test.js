const path = require('path');
const fs = require('fs');

const { webpack, evaluated } = require('./helpers');

const testCasesPath = path.join(__dirname, 'fixtures/icss/tests-cases');
const testCases = fs.readdirSync(testCasesPath);

describe('ICSS', () => {
  testCases.forEach((name) => {
    it(`case ${name}`, async () => {
      const testId = `./icss/tests-cases/${name}/source.css`;
      const stats = await webpack(testId);
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
