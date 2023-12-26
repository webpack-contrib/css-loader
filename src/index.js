/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/

import postcss from "postcss";
import postcssPkg from "postcss/package.json";
import { satisfies } from "semver";

import schema from "./options.json";
import { icssParser, importParser, urlParser } from "./plugins";
import {
  normalizeOptions,
  shouldUseModulesPlugins,
  shouldUseImportPlugin,
  shouldUseURLPlugin,
  shouldUseIcssPlugin,
  getPreRequester,
  getExportCode,
  getFilter,
  getImportCode,
  getModuleCode,
  getModulesPlugins,
  normalizeSourceMap,
  sort,
  combineRequests,
  stringifyRequest,
  warningFactory,
  syntaxErrorFactory,
} from "./utils";

export default async function loader(content, map, meta) {
  const rawOptions = this.getOptions(schema);
  const callback = this.async();

  if (
    this._compiler &&
    this._compiler.options &&
    this._compiler.options.experiments &&
    this._compiler.options.experiments.css &&
    this._module &&
    (this._module.type === "css" ||
      this._module.type === "css/auto" ||
      this._module.type === "css/global" ||
      this._module.type === "css/module")
  ) {
    this.emitWarning(
      new Error(
        'You can\'t use `experiments.css` (`experiments.futureDefaults` enable built-in CSS support by default) and `css-loader` together, please set `experiments.css` to `false` or set `{ type: "javascript/auto" }` for rules with `css-loader` in your webpack config (now css-loader does nothing).'
      )
    );

    callback(null, content, map, meta);

    return;
  }

  let options;

  try {
    options = normalizeOptions(rawOptions, this);
  } catch (error) {
    callback(error);

    return;
  }

  const plugins = [];
  const replacements = [];
  const exports = [];

  if (shouldUseModulesPlugins(options)) {
    plugins.push(...getModulesPlugins(options, this));
  }

  const importPluginImports = [];
  const importPluginApi = [];

  let isSupportAbsoluteURL = false;

  // TODO enable by default in the next major release
  if (
    this._compilation &&
    this._compilation.options &&
    this._compilation.options.experiments &&
    this._compilation.options.experiments.buildHttp
  ) {
    isSupportAbsoluteURL = true;
  }
  const isSupportDataURL =
    options.esModule && Boolean("fsStartTime" in this._compiler);

  if (shouldUseImportPlugin(options)) {
    plugins.push(
      importParser({
        isSupportAbsoluteURL: false,
        isSupportDataURL: false,
        isCSSStyleSheet: options.exportType === "css-style-sheet",
        loaderContext: this,
        imports: importPluginImports,
        api: importPluginApi,
        filter: options.import.filter,
        urlHandler: (url) =>
          stringifyRequest(
            this,
            combineRequests(getPreRequester(this)(options.importLoaders), url)
          ),
      })
    );
  }

  const urlPluginImports = [];

  if (shouldUseURLPlugin(options)) {
    const needToResolveURL = !options.esModule;

    plugins.push(
      urlParser({
        isSupportAbsoluteURL,
        isSupportDataURL,
        imports: urlPluginImports,
        replacements,
        context: this.context,
        rootContext: this.rootContext,
        filter: getFilter(options.url.filter, this.resourcePath),
        resolver: needToResolveURL
          ? this.getResolve({ mainFiles: [], extensions: [] })
          : // eslint-disable-next-line no-undefined
            undefined,
        urlHandler: (url) => stringifyRequest(this, url),
        // Support data urls as input in new URL added in webpack@5.38.0
      })
    );
  }

  const icssPluginImports = [];
  const icssPluginApi = [];

  const needToUseIcssPlugin = shouldUseIcssPlugin(options);

  if (needToUseIcssPlugin) {
    plugins.push(
      icssParser({
        loaderContext: this,
        imports: icssPluginImports,
        api: icssPluginApi,
        replacements,
        exports,
        urlHandler: (url) =>
          stringifyRequest(
            this,
            combineRequests(getPreRequester(this)(options.importLoaders), url)
          ),
      })
    );
  }

  // Reuse CSS AST (PostCSS AST e.g 'postcss-loader') to avoid reparsing
  if (meta) {
    const { ast } = meta;

    if (
      ast &&
      ast.type === "postcss" &&
      satisfies(ast.version, `^${postcssPkg.version}`)
    ) {
      // eslint-disable-next-line no-param-reassign
      content = ast.root;
    }
  }

  const { resourcePath } = this;

  let result;

  try {
    result = await postcss(plugins).process(content, {
      hideNothingWarning: true,
      from: resourcePath,
      to: resourcePath,
      map: options.sourceMap
        ? {
            prev: map ? normalizeSourceMap(map, resourcePath) : null,
            inline: false,
            annotation: false,
          }
        : false,
    });
  } catch (error) {
    if (error.file) {
      this.addDependency(error.file);
    }

    callback(
      error.name === "CssSyntaxError" ? syntaxErrorFactory(error) : error
    );

    return;
  }

  for (const warning of result.warnings()) {
    this.emitWarning(warningFactory(warning));
  }

  const imports = []
    .concat(icssPluginImports.sort(sort))
    .concat(importPluginImports.sort(sort))
    .concat(urlPluginImports.sort(sort));
  const api = []
    .concat(importPluginApi.sort(sort))
    .concat(icssPluginApi.sort(sort));

  if (options.modules.exportOnlyLocals !== true) {
    imports.unshift({
      type: "api_import",
      importName: "___CSS_LOADER_API_IMPORT___",
      url: stringifyRequest(this, require.resolve("./runtime/api")),
    });

    if (options.sourceMap) {
      imports.unshift({
        importName: "___CSS_LOADER_API_SOURCEMAP_IMPORT___",
        url: stringifyRequest(this, require.resolve("./runtime/sourceMaps")),
      });
    } else {
      imports.unshift({
        importName: "___CSS_LOADER_API_NO_SOURCEMAP_IMPORT___",
        url: stringifyRequest(this, require.resolve("./runtime/noSourceMaps")),
      });
    }
  }

  let isTemplateLiteralSupported = false;

  if (
    // eslint-disable-next-line no-underscore-dangle
    this._compilation &&
    // eslint-disable-next-line no-underscore-dangle
    this._compilation.options &&
    // eslint-disable-next-line no-underscore-dangle
    this._compilation.options.output &&
    // eslint-disable-next-line no-underscore-dangle
    this._compilation.options.output.environment &&
    // eslint-disable-next-line no-underscore-dangle
    this._compilation.options.output.environment.templateLiteral
  ) {
    isTemplateLiteralSupported = true;
  }

  const importCode = getImportCode(imports, options);

  let moduleCode;

  try {
    moduleCode = getModuleCode(
      result,
      api,
      replacements,
      options,
      isTemplateLiteralSupported,
      this
    );
  } catch (error) {
    callback(error);

    return;
  }

  const exportCode = getExportCode(
    exports,
    replacements,
    needToUseIcssPlugin,
    options,
    isTemplateLiteralSupported
  );

  callback(null, `${importCode}${moduleCode}${exportCode}`);
}
