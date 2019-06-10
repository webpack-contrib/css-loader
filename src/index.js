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
  getImportPrefix,
  getFilter,
  getImportCode,
  getModuleCode,
  getExportType,
  prepareCode,
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

  plugins.push(
    icssParser({
      exportLocalsStyle: options.exportLocalsStyle,
    })
  );

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

      if (!result.messages) {
        // eslint-disable-next-line no-param-reassign
        result.messages = [];
      }

      const {
        exportOnlyLocals: onlyLocals,
        exportLocalsStyle: localsStyle,
      } = options;
      // Run other loader (`postcss-loader`, `sass-loader` and etc) for importing CSS
      const importPrefix = getImportPrefix(this, options.importLoaders);

      const buildInfo = {
        loaderContext: this,
        hasUrlHelper: false,
        sourceMap,
        result,
        onlyLocals,
        localsStyle,
        importPrefix,
      };

      const importCode = getImportCode(buildInfo);
      const moduleCode = getModuleCode(buildInfo);
      const exportItems = result.messages
        .filter((message) => (message.type === 'export' ? message : false))
        .reduce((accumulator, currentValue) => {
          accumulator.push(currentValue.export);

          return accumulator;
        }, []);

      const code = [
        // API
        importCode.length > 0 || moduleCode.length > 0
          ? `exports = module.exports = require(${stringifyRequest(
              this,
              require.resolve('./runtime/api')
            )})(${sourceMap});\n`
          : false,
        // Imports
        importCode,
        // Code
        moduleCode,
        // Exports
        exportItems.length > 0
          ? `${getExportType(onlyLocals)} = {\n${exportItems.join(',\n')}\n};`
          : false,
      ]
        .filter(Boolean)
        .join('');

      return callback(null, prepareCode(buildInfo, code));
    })
    .catch((error) => {
      callback(
        error.name === 'CssSyntaxError' ? new CssSyntaxError(error) : error
      );
    });
}
