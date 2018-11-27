const path = require('path');
const fs = require('fs');

const { webpack, evaluated } = require('./helpers');

const testCasesPath = path.join(__dirname, 'fixtures/modules/tests-cases');
const testCases = fs.readdirSync(testCasesPath);

describe('modules option', () => {
  [true, false].forEach((optionValue) => {
    testCases.forEach((name) => {
      it(`case ${name} (option is ${optionValue})`, async () => {
        const config = {
          loader: {
            options: { modules: optionValue, localIdentName: '_[local]' },
          },
        };
        const testId = `./modules/tests-cases/${name}/source.css`;
        const stats = await webpack(testId, config);
        const { modules } = stats.toJson();
        const module = modules.find((m) => m.id === testId);
        const evaluatedModule = evaluated(module.source, modules);

        // console.log(module)

        expect(evaluatedModule).toMatchSnapshot('module (evaluated)');
        expect(evaluatedModule.locals).toMatchSnapshot('locals');
        expect(stats.compilation.warnings).toMatchSnapshot('warnings');
        expect(stats.compilation.errors).toMatchSnapshot('errors');
      });
    });
  });
});
