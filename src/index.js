/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
import { getOptions, isUrlRequest, stringifyRequest } from 'loader-utils';
import postcss from 'postcss';
import postcssPkg from 'postcss/package.json';
import validateOptions from 'schema-utils';
import { satisfies } from 'semver';

import CssSyntaxError from './CssSyntaxError';
import Warning from './Warning';
import schema from './options.json';
import { icssParser, importParser, urlParser } from './plugins';
import {
  getPreRequester,
  getExportCode,
  getFilter,
  getImportCode,
  getModuleCode,
  getModulesPlugins,
  shouldUseModulesPlugins,
} from './utils';

export default function loader(content, map, meta) {
  const options = getOptions(this) || {};

  validateOptions(schema, options, {
    name: 'CSS Loader',
    baseDataPath: 'options',
  });

  const callback = this.async();
  const sourceMap = options.sourceMap || false;
  const plugins = [];

  if (shouldUseModulesPlugins(options.modules, this.resourcePath)) {
    plugins.push(...getModulesPlugins(options, this));
  }

  const exportType = options.onlyLocals ? 'locals' : 'full';
  const preRequester = getPreRequester(this);
  const urlHandler = (url) =>
    stringifyRequest(this, preRequester(options.importLoaders) + url);

  plugins.push(icssParser({ urlHandler }));

  if (options.import !== false && exportType === 'full') {
    plugins.push(
      importParser({
        filter: getFilter(options.import, this.resourcePath),
        urlHandler,
      })
    );
  }

  if (options.url !== false && exportType === 'full') {
    plugins.push(
      urlParser({
        filter: getFilter(options.url, this.resourcePath, (value) =>
          isUrlRequest(value)
        ),
        urlHandler: (url) => stringifyRequest(this, url),
      })
    );
  }

  // Reuse CSS AST (PostCSS AST e.g 'postcss-loader') to avoid reparsing
  if (meta) {
    const { ast } = meta;

    if (
      ast &&
      ast.type === 'postcss' &&
      satisfies(ast.version, `^${postcssPkg.version}`)
    ) {
      // eslint-disable-next-line no-param-reassign
      content = ast.root;
    }
  }

  postcss(plugins)
    .process(content, {
      from: this.remainingRequest.split('!').pop(),
      to: null,
      map: options.sourceMap
        ? {
            // Some loaders (example `"postcss-loader": "1.x.x"`) always generates source map, we should remove it
            prev: sourceMap && map ? map : null,
            inline: false,
            annotation: false,
          }
        : false,
    })
    .then((result) => {
      for (const warning of result.warnings()) {
        this.emitWarning(new Warning(warning));
      }

      const imports = [];
      const apiImports = [];
      const urlReplacements = [];
      const icssReplacements = [];
      const exports = [];

      for (const message of result.messages) {
        // eslint-disable-next-line default-case
        switch (message.type) {
          case 'import':
            imports.push(message.value);
            break;
          case 'api-import':
            apiImports.push(message.value);
            break;
          case 'url-replacement':
            urlReplacements.push(message.value);
            break;
          case 'icss-replacement':
            icssReplacements.push(message.value);
            break;
          case 'export':
            exports.push(message.value);
            break;
        }
      }

      const { localsConvention } = options;
      const esModule =
        typeof options.esModule !== 'undefined' ? options.esModule : false;

      const importCode = getImportCode(this, exportType, imports, esModule);
      const moduleCode = getModuleCode(
        result,
        exportType,
        sourceMap,
        apiImports,
        urlReplacements,
        icssReplacements,
        esModule,
        this
      );
      const exportCode = getExportCode(
        exports,
        exportType,
        localsConvention,
        icssReplacements,
        esModule
      );

      return callback(null, `${importCode}${moduleCode}${exportCode}`);
    })
    .catch((error) => {
      callback(
        error.name === 'CssSyntaxError' ? new CssSyntaxError(error) : error
      );
    });
}
