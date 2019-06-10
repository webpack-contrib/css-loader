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
} from 'loader-utils';

import schema from './options.json';
import { importParser, icssParser, urlParser } from './plugins';
import {
  normalizeSourceMap,
  getModulesPlugins,
  getImportPrefix,
  getFilter,
  getApiCode,
  getImportCode,
  getModuleCode,
  getExportCode,
  prepareCode,
} from './utils';
import Warning from './Warning';
import CssSyntaxError from './CssSyntaxError';

export default function loader(content, map, meta) {
  const options = getOptions(this) || {};

  validateOptions(schema, options, 'CSS Loader');

  const callback = this.async();
  const sourceMap = options.sourceMap || false;

  // Some loaders (example `"postcss-loader": "1.x.x"`) always generates source map, we should remove it
  // eslint-disable-next-line no-param-reassign
  map = sourceMap && map ? normalizeSourceMap(map) : null;

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

  // Run other loader (`postcss-loader`, `sass-loader` and etc) for importing CSS
  const importPrefix = getImportPrefix(this, options.importLoaders);

  plugins.push(
    icssParser({
      loaderContext: this,
      importPrefix,
      exportLocalsStyle: options.exportLocalsStyle,
    })
  );

  if (options.import !== false) {
    plugins.push(
      importParser({
        loaderContext: this,
        importPrefix,
        filter: getFilter(options.import, this.resourcePath),
      })
    );
  }

  if (options.url !== false) {
    plugins.push(
      urlParser({
        loaderContext: this,
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

      const { exportOnlyLocals: onlyLocals } = options;

      const importItems = result.messages
        .filter((message) => (message.type === 'import' ? message : false))
        .reduce((accumulator, currentValue) => {
          accumulator.push(currentValue.import);

          return accumulator;
        }, []);
      const exportItems = result.messages
        .filter((message) => (message.type === 'export' ? message : false))
        .reduce((accumulator, currentValue) => {
          accumulator.push(currentValue.export);

          return accumulator;
        }, []);

      const importCode = getImportCode(importItems, onlyLocals);
      const moduleCode = getModuleCode(result, sourceMap, onlyLocals);
      const exportCode = getExportCode(exportItems, onlyLocals);
      const apiCode = getApiCode(this, sourceMap, onlyLocals);

      return callback(
        null,
        prepareCode(
          { apiCode, importCode, moduleCode, exportCode },
          result.messages,
          this,
          importPrefix,
          onlyLocals
        )
      );
    })
    .catch((error) => {
      callback(
        error.name === 'CssSyntaxError' ? new CssSyntaxError(error) : error
      );
    });
}
