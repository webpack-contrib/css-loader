/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
import validateOptions from 'schema-utils';
import postcss from 'postcss';
import postcssPkg from 'postcss/package.json';

import {
  getOptions,
  isUrlRequest,
  getRemainingRequest,
  getCurrentRequest,
  stringifyRequest,
} from 'loader-utils';

import schema from './options.json';
import { importParser, icssParser, urlParser } from './plugins';
import {
  normalizeSourceMap,
  getModulesPlugins,
  placholderRegExps,
  getImportPrefix,
  getImportItemReplacer,
  getFilter,
  getExports,
  getImports,
} from './utils';
import Warning from './Warning';
import CssSyntaxError from './CssSyntaxError';

export default function loader(content, map, meta) {
  const options = getOptions(this) || {};

  validateOptions(schema, options, 'CSS Loader');

  const callback = this.async();
  const sourceMap = options.sourceMap || false;

  if (sourceMap && map) {
    // eslint-disable-next-line no-param-reassign
    map = normalizeSourceMap(map);
  } else {
    // Some loaders (example `"postcss-loader": "1.x.x"`) always generates source map, we should remove it
    // eslint-disable-next-line no-param-reassign
    map = null;
  }

  // Reuse CSS AST (PostCSS AST e.g 'postcss-loader') to avoid reparsing
  if (meta) {
    const { ast } = meta;

    if (ast && ast.type === 'postcss' && ast.version === postcssPkg.version) {
      // eslint-disable-next-line no-param-reassign
      content = ast.root;
    }
  }

  const plugins = [];

  if (options.modules) {
    plugins.push(...getModulesPlugins(options, this));
  }

  if (options.import !== false) {
    plugins.push(
      importParser({
        filter: getFilter(options.import, this.resourcePath),
      })
    );
  }

  if (options.url !== false) {
    plugins.push(
      urlParser({
        filter: getFilter(options.url, this.resourcePath, (value) =>
          isUrlRequest(value)
        ),
      })
    );
  }

  plugins.push(icssParser());

  postcss(plugins)
    .process(content, {
      from: getRemainingRequest(this)
        .split('!')
        .pop(),
      to: getCurrentRequest(this)
        .split('!')
        .pop(),
      map: options.sourceMap
        ? {
            prev: map,
            inline: false,
            annotation: false,
          }
        : null,
    })
    .then((result) => {
      result
        .warnings()
        .forEach((warning) => this.emitWarning(new Warning(warning)));

      const messages = result.messages || [];
      const { exportOnlyLocals, importLoaders, camelCase } = options;

      // Run other loader (`postcss-loader`, `sass-loader` and etc) for importing CSS
      const importPrefix = getImportPrefix(this, importLoaders);

      // Prepare replacer to change from `___CSS_LOADER_IMPORT___INDEX___` to `require('./file.css').locals`
      const importItemReplacer = getImportItemReplacer(
        messages,
        this,
        importPrefix,
        exportOnlyLocals
      );

      const exports = getExports(messages, camelCase, importItemReplacer);

      if (exportOnlyLocals) {
        return callback(
          null,
          exports.length > 0
            ? `module.exports = {\n${exports.join(',\n')}\n};`
            : ''
        );
      }

      let cssAsString = JSON.stringify(result.css).replace(
        placholderRegExps.importItemG,
        importItemReplacer
      );

      const imports = getImports(messages, importPrefix, this, (message) => {
        if (message.type !== 'url') {
          return;
        }

        const { placeholder } = message.item;

        cssAsString = cssAsString.replace(
          new RegExp(placeholder, 'g'),
          () => `" + ${placeholder} + "`
        );
      });

      const runtimeCode = `exports = module.exports = require(${stringifyRequest(
        this,
        require.resolve('./runtime/api')
      )})(${!!sourceMap});\n`;
      const importCode =
        imports.length > 0 ? `// Imports\n${imports.join('\n')}\n\n` : '';
      const moduleCode = `// Module\nexports.push([module.id, ${cssAsString}, ""${
        result.map ? `,${result.map}` : ''
      }]);\n\n`;
      const exportsCode =
        exports.length > 0
          ? `// Exports\nexports.locals = {\n${exports.join(',\n')}\n};`
          : '';

      // Embed runtime
      return callback(
        null,
        runtimeCode + importCode + moduleCode + exportsCode
      );
    })
    .catch((error) => {
      callback(
        error.name === 'CssSyntaxError' ? new CssSyntaxError(error) : error
      );
    });
}
