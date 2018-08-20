import vm from 'vm';
import path from 'path';

function evaluated(output, modules, moduleId = 1) {
  const m = { exports: {}, id: moduleId };

  try {
    const fn = vm.runInThisContext(
      `(function(module, exports, require) {${output}})`,
      'testcase.js'
    );

    fn(m, m.exports, (module) => {
      if (module.indexOf('api.js') >= 0) {
        // eslint-disable-next-line global-require
        return require('../../src/runtime/api');
      }

      if (module.indexOf('escape.js') >= 0) {
        // eslint-disable-next-line global-require
        return require('../../src/runtime/escape');
      }

      if (/^-!.*?!.*$/.test(module)) {
        // eslint-disable-next-line no-param-reassign
        module = module.replace(/-!(.*)?!/, '');
      }

      if (modules) {
        const importedModule = modules.find((el) => {
          // Maybe we should do better
          // Need pass webpack config and create resolver, but not critical for tests right now
          const modulePath = el.identifier.split('!').pop();
          const resolvedModulePath = path.resolve(
            __dirname,
            '../fixtures/css-modules',
            module
          );
          const resolvedModulePath2 = path.resolve(
            __dirname,
            '../fixtures/import',
            module
          );
          const resolvedModulePathNodeModules = path.resolve(
            __dirname,
            '../fixtures/import/node_modules',
            module
          );

          return (
            modulePath === resolvedModulePath ||
            modulePath === resolvedModulePath2 ||
            modulePath === resolvedModulePathNodeModules
          );
        });

        if (importedModule) {
          // eslint-disable-next-line no-param-reassign
          moduleId += 1;

          return evaluated(importedModule.source, modules, moduleId);
        }
      }

      return `{${module}}`;
    });
  } catch (e) {
    console.error(output); // eslint-disable-line no-console
    throw e;
  }

  delete m.exports.toString;
  delete m.exports.i;

  return m.exports;
}

export default evaluated;
