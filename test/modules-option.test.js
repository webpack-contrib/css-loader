const path = require('path');
const fs = require('fs');

const { webpack, evaluated } = require('./helpers');

const testCasesPath = path.join(__dirname, 'fixtures/modules/tests-cases');
const testCases = fs.readdirSync(testCasesPath);

describe('modules option', () => {
  [false, true].forEach((isLocalsLoader) => {
    [false, true].forEach((modulesValue) => {
      testCases.forEach((name) => {
        it(`case name \`${name}\`: (use \`${
          isLocalsLoader ? 'localsLoader.js' : 'loader.js'
        }\`) (\`modules\` option is ${modulesValue})`, async () => {
          const config = {
            loader: {
              options: { modules: modulesValue, localIdentName: '_[local]' },
            },
            localsLoader: isLocalsLoader,
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
});
