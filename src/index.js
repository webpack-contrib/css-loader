/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
import validateOptions from 'schema-utils';
import RequestShortener from 'webpack/lib/RequestShortener';
import postcss from 'postcss';
import postcssPkg from 'postcss/package.json';

import { getOptions, isUrlRequest } from 'loader-utils';

import schema from './options.json';
import { importParser, icssParser, urlParser } from './plugins';
import {
  normalizeSourceMap,
  getModulesPlugins,
  getFilter,
  getImportCode,
  getModuleCode,
  getExportCode,
} from './utils';
import Warning from './Warning';
import CssSyntaxError from './CssSyntaxError';

export default function loader(content, map, meta) {
  const options = getOptions(this) || {};

  validateOptions(schema, options, {
    name: 'CSS Loader',
    baseDataPath: 'options',
  });

  const callback = this.async();
  const sourceMap = options.sourceMap || false;
  const plugins = [];

  if (options.modules) {
    plugins.push(...getModulesPlugins(options, this));
  }

  const exportType = options.onlyLocals ? 'locals' : 'full';

  plugins.push(icssParser());

  if (options.import !== false && exportType === 'full') {
    plugins.push(
      importParser({
        filter: getFilter(options.import, this.resourcePath),
      })
    );
  }

  if (options.url !== false && exportType === 'full') {
    plugins.push(
      urlParser({
        filter: getFilter(options.url, this.resourcePath, (value) =>
          isUrlRequest(value)
        ),
      })
    );
  }

  // Reuse CSS AST (PostCSS AST e.g 'postcss-loader') to avoid reparsing
  if (meta) {
    const { ast } = meta;

    if (ast && ast.type === 'postcss' && ast.version === postcssPkg.version) {
      // eslint-disable-next-line no-param-reassign
      content = ast.root;
    }
  }

  postcss(plugins)
    .process(content, {
      from: this.remainingRequest.split('!').pop(),
      to: this.currentRequest.split('!').pop(),
      map: options.sourceMap
        ? {
            // Some loaders (example `"postcss-loader": "1.x.x"`) always generates source map, we should remove it
            prev:
              sourceMap && map
                ? normalizeSourceMap(
                    map,
                    new RequestShortener(this.rootContext)
                  )
                : null,
            inline: false,
            annotation: false,
          }
        : false,
    })
    .then((result) => {
      result
        .warnings()
        .forEach((warning) => this.emitWarning(new Warning(warning)));

      const imports = [];
      const exports = [];
      const replacers = [];

      for (const message of result.messages) {
        // eslint-disable-next-line default-case
        switch (message.type) {
          case 'import':
            imports.push(message.value);
            break;
          case 'export':
            exports.push(message.value);
            break;
          case 'replacer':
            replacers.push(message.value);
            break;
        }
      }

      const { importLoaders, localsConvention } = options;
      const esModule =
        typeof options.esModule !== 'undefined' ? options.esModule : false;

      const importCode = getImportCode(
        this,
        imports,
        exportType,
        sourceMap,
        importLoaders,
        esModule
      );
      const moduleCode = getModuleCode(
        this,
        result,
        exportType,
        sourceMap,
        replacers
      );
      const exportCode = getExportCode(
        this,
        exports,
        exportType,
        replacers,
        localsConvention,
        esModule
      );

      return callback(null, [importCode, moduleCode, exportCode].join(''));
    })
    .catch((error) => {
      callback(
        error.name === 'CssSyntaxError' ? new CssSyntaxError(error) : error
      );
    });
}
