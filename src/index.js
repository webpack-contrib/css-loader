/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
import { getOptions, stringifyRequest } from 'loader-utils';
import postcss from 'postcss';
import postcssPkg from 'postcss/package.json';
import validateOptions from 'schema-utils';
import { satisfies } from 'semver';

import CssSyntaxError from './CssSyntaxError';
import Warning from './Warning';
import schema from './options.json';
import { icssParser, importParser, urlParser } from './plugins';
import {
  getModulesOptions,
  getPreRequester,
  getExportCode,
  getFilter,
  getImportCode,
  getModuleCode,
  getModulesPlugins,
  normalizeSourceMap,
  shouldUseModulesPlugins,
  isUrlRequestable,
} from './utils';

export default function loader(content, map, meta) {
  const options = getOptions(this);

  validateOptions(schema, options, {
    name: 'CSS Loader',
    baseDataPath: 'options',
  });

  const sourceMap =
    typeof options.sourceMap === 'boolean' ? options.sourceMap : this.sourceMap;
  const plugins = [];

  const exportType = options.onlyLocals ? 'locals' : 'full';
  const preRequester = getPreRequester(this);
  const urlHandler = (url) =>
    stringifyRequest(this, preRequester(options.importLoaders) + url);

  const esModule =
    typeof options.esModule !== 'undefined' ? options.esModule : true;

  let modulesOptions;

  if (shouldUseModulesPlugins(options.modules, this.resourcePath)) {
    modulesOptions = getModulesOptions(options, this);

    if (modulesOptions.namedExport === true && esModule === false) {
      this.emitError(
        new Error(
          '`Options.module.namedExport` cannot be used without `options.esModule`'
        )
      );
    }

    plugins.push(...getModulesPlugins(modulesOptions, this));

    const icssResolver = this.getResolve({
      mainFields: ['css', 'style', 'main', '...'],
      mainFiles: ['index', '...'],
    });

    plugins.push(
      icssParser({
        context: this.context,
        rootContext: this.rootContext,
        resolver: icssResolver,
        urlHandler,
      })
    );
  }

  if (options.import !== false && exportType === 'full') {
    const resolver = this.getResolve({
      mainFields: ['css', 'style', 'main', '...'],
      mainFiles: ['index', '...'],
      extensions: ['.css'],
      restrictions: [/\.css$/i],
      conditionNames: ['style'],
    });

    plugins.push(
      importParser({
        context: this.context,
        rootContext: this.rootContext,
        filter: getFilter(options.import, this.resourcePath),
        resolver,
        urlHandler,
      })
    );
  }

  if (options.url !== false && exportType === 'full') {
    const urlResolver = this.getResolve({
      mainFields: ['asset'],
      conditionNames: ['asset'],
    });

    plugins.push(
      urlParser({
        context: this.context,
        rootContext: this.rootContext,
        filter: getFilter(options.url, this.resourcePath, (value) =>
          isUrlRequestable(value)
        ),
        resolver: urlResolver,
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

  const callback = this.async();

  postcss(plugins)
    .process(content, {
      from: this.resourcePath,
      to: this.resourcePath,
      map: options.sourceMap
        ? {
            // Some loaders (example `"postcss-loader": "1.x.x"`) always generates source map, we should remove it
            prev: sourceMap && map ? normalizeSourceMap(map) : null,
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

      /*
       *   Order
       *   CSS_LOADER_ICSS_IMPORT: [],
       *   CSS_LOADER_AT_RULE_IMPORT: [],
       *   CSS_LOADER_GET_URL_IMPORT: [],
       *   CSS_LOADER_URL_IMPORT: [],
       *   CSS_LOADER_URL_REPLACEMENT: [],
       * */

      imports.sort((a, b) => {
        return (
          (b.order < a.order) - (a.order < b.order) ||
          (b.index < a.index) - (a.index < b.index)
        );
      });
      apiImports.sort((a, b) => {
        return (
          (b.order < a.order) - (a.order < b.order) ||
          (b.index < a.index) - (a.index < b.index)
        );
      });

      const importCode = getImportCode(
        this,
        exportType,
        imports,
        esModule,
        modulesOptions
      );
      const moduleCode = getModuleCode(
        result,
        exportType,
        sourceMap,
        apiImports,
        urlReplacements,
        icssReplacements,
        esModule,
        modulesOptions
      );
      const exportCode = getExportCode(
        exports,
        exportType,
        icssReplacements,
        esModule,
        modulesOptions
      );

      return callback(null, `${importCode}${moduleCode}${exportCode}`);
    })
    .catch((error) => {
      if (error.file) {
        this.addDependency(error.file);
      }

      callback(
        error.name === 'CssSyntaxError' ? new CssSyntaxError(error) : error
      );
    });
}
