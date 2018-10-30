import vm from 'vm';
import path from 'path';

function evaluated(output, modules, moduleId = 1) {
  const m = { exports: {}, id: moduleId };

  try {
    const fn = vm.runInThisContext(
      `(function(module, exports, require) {var __webpack_public_path__ = '/webpack/public/path/';${output}})`,
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
          const modulePath = el.identifier.split('!').pop();
          const importedPaths = [
            '',
            'import',
            'import/node_modules',
            'messages-api',
            'source-map',
            'url',
            'url/node_modules',
            'sass-loader',
          ].map((importedPath) =>
            path.resolve(__dirname, `../fixtures/${importedPath}`, module)
          );

          return importedPaths.includes(modulePath);
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
